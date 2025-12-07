/**
 * Test Runner Service - Executes Playwright tests
 */

import { chromium, firefox, webkit, Browser, Page } from 'playwright';
import type { TestSuite, TestExecution } from '@shared/types';
import { TestExecutionModel } from '../database/models/test-execution.model';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface RunOptions {
    browser?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
    timeout?: number;
}

export class TestRunner {
    private executionModel: TestExecutionModel;

    constructor() {
        this.executionModel = new TestExecutionModel();
    }

    /**
     * Run a test suite
     */
    async runTest(suite: TestSuite, options: RunOptions = {}): Promise<TestExecution> {
        const startTime = Date.now();

        // Create execution record
        const execution = await this.executionModel.create(suite.id);

        try {
            // Setup
            const { browser, page } = await this.setupBrowser(options);
            const screenshots: string[] = [];
            let logs = '';

            // Create screenshots directory
            const screenshotDir = path.join('test-suites', `llmtestkit-${suite.version}`, 'screenshots');
            fs.mkdirSync(screenshotDir, { recursive: true });

            // Intercept console logs
            page.on('console', msg => {
                logs += `[${msg.type()}] ${msg.text()}\n`;
            });

            // Write test code to temporary file
            const testFilePath = await this.writeTestFile(suite.generatedCode);

            try {
                // Execute the test code using eval (careful approach)
                await this.executeTestCode(suite.generatedCode, page, screenshotDir, screenshots);

                // Test passed
                const duration = Date.now() - startTime;
                const updatedExecution = await this.executionModel.update(execution.id, {
                    status: 'passed',
                    completedAt: new Date(),
                    duration,
                    screenshots,
                    logs,
                });

                await browser.close();
                this.cleanupTestFile(testFilePath);

                if (!updatedExecution) {
                    throw new Error('Failed to update execution record');
                }

                return updatedExecution;
            } catch (error) {
                // Test failed
                const duration = Date.now() - startTime;
                const errorMessage = error instanceof Error ? error.message : String(error);

                // Take failure screenshot
                const failureScreenshot = path.join(screenshotDir, `failure-${Date.now()}.png`);
                await page.screenshot({ path: failureScreenshot, fullPage: true });
                screenshots.push(failureScreenshot);

                const updatedExecution = await this.executionModel.update(execution.id, {
                    status: 'failed',
                    completedAt: new Date(),
                    duration,
                    screenshots,
                    logs,
                    error: errorMessage,
                });

                await browser.close();
                this.cleanupTestFile(testFilePath);

                if (!updatedExecution) {
                    throw new Error('Failed to update execution record');
                }

                return updatedExecution;
            }
        } catch (setupError) {
            // Setup/teardown error
            const duration = Date.now() - startTime;
            const errorMessage = setupError instanceof Error ? setupError.message : String(setupError);

            const updatedExecution = await this.executionModel.update(execution.id, {
                status: 'failed',
                completedAt: new Date(),
                duration,
                error: `Setup error: ${errorMessage}`,
            });

            if (!updatedExecution) {
                throw new Error('Failed to update execution record');
            }

            return updatedExecution;
        }
    }

    /**
     * Setup browser instance
     */
    private async setupBrowser(options: RunOptions): Promise<{ browser: Browser; page: Page }> {
        const browserType = options.browser || 'chromium';
        const headless = options.headless !== false; // default true

        let browser: Browser;

        switch (browserType) {
            case 'firefox':
                browser = await firefox.launch({ headless });
                break;
            case 'webkit':
                browser = await webkit.launch({ headless });
                break;
            default:
                browser = await chromium.launch({ headless });
        }

        const page = await browser.newPage();
        page.setDefaultTimeout(options.timeout || 30000);

        return { browser, page };
    }

    /**
     * Execute test code
     */
    private async executeTestCode(
        generatedCode: string,
        page: Page,
        screenshotDir: string,
        screenshots: string[]
    ): Promise<void> {
        // Extract the test body (code inside the test function)
        const testBodyMatch = generatedCode.match(/test\([^,]+,\s*async\s*\(\s*\{\s*page\s*\}\s*\)\s*=>\s*\{([\s\S]*)\}\s*\);/);

        if (!testBodyMatch) {
            throw new Error('Could not extract test body from generated code');
        }

        const testBody = testBodyMatch[1];

        // Create expect function
        const expect = (locator: any) => ({
            toContainText: async (text: string) => {
                const content = await locator.textContent();
                if (!content || !content.includes(text)) {
                    throw new Error(`Expected element to contain text "${text}", but got "${content}"`);
                }
            },
            toHaveURL: async (url: string) => {
                const currentUrl = page.url();
                if (currentUrl !== url) {
                    throw new Error(`Expected URL to be "${url}", but got "${currentUrl}"`);
                }
            },
        });

        // Execute the test body with page context
        const executeTest = new Function('page', 'expect', 'screenshotDir', 'screenshots', `
            return (async () => {
                ${testBody}
            })();
        `);

        await executeTest(page, expect, screenshotDir, screenshots);
    }

    /**
     * Write test code to temporary file
     */
    private async writeTestFile(code: string): Promise<string> {
        const tempDir = path.join(process.cwd(), 'temp');
        fs.mkdirSync(tempDir, { recursive: true });

        const fileName = `test-${uuidv4()}.spec.ts`;
        const filePath = path.join(tempDir, fileName);

        fs.writeFileSync(filePath, code);

        return filePath;
    }

    /**
     * Cleanup temporary test file
     */
    private cleanupTestFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Failed to cleanup test file:', error);
        }
    }
}
