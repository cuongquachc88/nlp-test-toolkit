/**
 * NLP Parser - Wrapper around LLM adapters
 * Provides simplified interface for parsing natural language to Playwright commands
 */

import type { ParseContext, ParseResult, PlaywrightCommand } from '@shared/types';
import { AdapterFactory } from './adapters/factory';
import { loadAdapterConfig } from '@/utils/config';

export class NLPParser {
    private factory: AdapterFactory;

    constructor() {
        const config = loadAdapterConfig();
        this.factory = new AdapterFactory(config);
    }

    async parse(
        userInput: string,
        context?: ParseContext
    ): Promise<ParseResult> {
        // Get primary adapter with fallback support
        const adapter = await this.factory.getPrimaryAdapter();

        // Debug: Log user input
        console.log('\n=== USER INPUT TO LLM ===');
        console.log(userInput);
        console.log('=========================\n');

        // Skip DOM fetching for SEO/performance/accessibility tests (DOM context not useful)
        const skipDOMKeywords = ['seo', 'performance', 'accessibility', 'lighthouse', 'pagespeed', 'meta tag', 'schema'];
        const shouldSkipDOM = skipDOMKeywords.some(keyword =>
            userInput.toLowerCase().includes(keyword)
        );

        // Check if user input contains a URL - if so, fetch DOM info (unless skipped)
        const urlMatch = userInput.match(/https?:\/\/[^\s]+/);
        if (urlMatch && !shouldSkipDOM) {
            const url = urlMatch[0];
            console.log(`[Parser] Detected URL: ${url}, fetching DOM info...`);

            const { domFetcher } = await import('@/services/dom-fetcher');
            const domInfo = await domFetcher.getDOMInfo(url);

            if (domInfo) {
                // Add condensed DOM info inline
                const domContext = domFetcher.formatForLLM(domInfo);
                const enhancedInput = `${userInput}\n[Context: ${domContext}]`;

                console.log('[Parser] Enhanced with DOM context');
                const result = await adapter.parse(enhancedInput, context);
                this.validateCommands(result.commands);
                return result;
            }
        }

        // Parse using the adapter (without DOM context)
        const result = await adapter.parse(userInput, context);

        // Validate commands
        this.validateCommands(result.commands);

        return result;
    }

    /**
     * Parse conversational input with message history
     */
    async parseConversational(
        messages: Array<{ role: 'user' | 'assistant'; content: string }>,
        context?: ParseContext
    ): Promise<ParseResult> {
        // Build context from previous messages
        const conversationContext = messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');

        // Get the latest user message
        const latestMessage = messages
            .filter(m => m.role === 'user')
            .pop()?.content || '';

        // Parse with conversation context
        return this.parse(latestMessage, {
            ...context,
            testMetadata: {
                ...context?.testMetadata,
                conversationHistory: conversationContext,
            },
        });
    }

    /**
     * Generate Playwright TypeScript code from commands
     */
    generatePlaywrightCode(
        commands: PlaywrightCommand[],
        options?: {
            testName?: string;
            imports?: boolean;
        }
    ): string {
        const testName = options?.testName || 'Generated Test';
        const includeImports = options?.imports !== false;

        let code = '';

        if (includeImports) {
            code += `import { test, expect } from '@playwright/test';\n\n`;
        }

        code += `test('${testName}', async ({ page }) => {\n`;

        for (const cmd of commands) {
            code += this.commandToCode(cmd);
        }

        code += `});\n`;

        return code;
    }

    /**
     * Convert a single command to Playwright code
     */
    private commandToCode(cmd: PlaywrightCommand): string {
        const indent = '  ';
        let code = '';

        // Add comment with description
        if (cmd.description) {
            code += `${indent}// ${cmd.description}\n`;
        }

        switch (cmd.type) {
            case 'navigate':
                code += `${indent}await page.goto('${cmd.value}');\n`;
                break;

            case 'click':
                code += `${indent}await page.click('${cmd.selector}');\n`;
                break;

            case 'type':
            case 'fill':
                code += `${indent}await page.fill('${cmd.selector}', '${cmd.value}');\n`;
                break;

            case 'assert':
                if (cmd.selector) {
                    code += `${indent}await expect(page.locator('${cmd.selector}')).toContainText('${cmd.value}');\n`;
                } else {
                    code += `${indent}await expect(page).toHaveURL('${cmd.value}');\n`;
                }
                break;

            case 'wait':
                if (cmd.selector) {
                    code += `${indent}await page.waitForSelector('${cmd.selector}');\n`;
                } else if (cmd.value) {
                    const ms = parseInt(cmd.value) * 1000;
                    code += `${indent}await page.waitForTimeout(${ms});\n`;
                }
                break;

            case 'screenshot':
                if (cmd.selector) {
                    code += `${indent}await page.locator('${cmd.selector}').screenshot({ path: 'screenshot.png' });\n`;
                } else {
                    code += `${indent}await page.screenshot({ path: 'screenshot.png' });\n`;
                }
                break;

            case 'select':
                code += `${indent}await page.selectOption('${cmd.selector}', '${cmd.value}');\n`;
                break;

            case 'hover':
                code += `${indent}await page.hover('${cmd.selector}');\n`;
                break;

            case 'press':
                code += `${indent}await page.keyboard.press('${cmd.value}');\n`;
                break;

            default:
                code += `${indent}// Unknown command type: ${cmd.type}\n`;
        }

        code += '\n';
        return code;
    }

    /**
     * Validate commands for common issues
     */
    private validateCommands(commands: PlaywrightCommand[]): void {
        for (const cmd of commands) {
            // Validate required fields
            if (cmd.type === 'navigate' && !cmd.value) {
                throw new Error('Navigate command requires a URL value');
            }

            if (['click', 'fill', 'type', 'select', 'hover'].includes(cmd.type) && !cmd.selector) {
                throw new Error(`${cmd.type} command requires a selector`);
            }

            if (['fill', 'type', 'select'].includes(cmd.type) && !cmd.value) {
                throw new Error(`${cmd.type} command requires a value`);
            }
        }
    }

    /**
     * Get available providers and their health status
     */
    async getProviderHealth(): Promise<Record<string, boolean>> {
        return this.factory.healthCheckAll();
    }

    /**
     * Get list of registered providers
     */
    getProviders(): string[] {
        return this.factory.getRegisteredProviders();
    }
}
