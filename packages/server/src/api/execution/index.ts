/**
 * Test Execution API Routes
 * Handles test execution operations
 */

import express from 'express';
import type { RunTestRequest, PlaywrightCommand, CommandExecutionResult } from '@shared/types';
import { TestSuiteModel } from '../../database/models/test-suite.model';
import { TestExecutionModel } from '../../database/models/test-execution.model';
import { TestRunner } from '../../services/test-runner';

const router: express.Router = express.Router();
const suiteModel = new TestSuiteModel();
const executionModel = new TestExecutionModel();
const testRunner = new TestRunner();

// POST /api/execution/run/:suiteId - Run test suite
router.post('/run/:suiteId', async (req, res) => {
    try {
        const { suiteId } = req.params;
        const options: RunTestRequest = req.body;

        // Get test suite
        const suite = await suiteModel.getById(suiteId);
        if (!suite) {
            return res.status(404).json({ error: 'Test suite not found' });
        }

        // Start test execution asynchronously
        // Return execution ID immediately so user can poll for results
        testRunner.runTest(suite, {
            browser: options.browser || 'chromium',
            headless: options.headless !== false,
        }).catch(error => {
            console.error('Test execution failed:', error);
        });

        // Get the execution record (it was created by runTest)
        const executions = executionModel.getBySuiteId(suiteId);
        const latestExecution = (await executions)[0]; // Most recent

        return res.status(202).json({
            message: 'Test execution started',
            executionId: latestExecution.id,
            status: latestExecution.status,
        });
    } catch (error) {
        console.error('Run test error:', error);
        return res.status(500).json({
            error: 'Failed to run test',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/execution/:id - Get execution result
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const execution = await executionModel.getById(id);

        if (!execution) {
            return res.status(404).json({ error: 'Execution not found' });
        }

        return res.json(execution);
    } catch (error) {
        console.error('Get execution error:', error);
        return res.status(500).json({
            error: 'Failed to get execution',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/execution/suite/:suiteId - Get execution history for a suite
router.get('/suite/:suiteId', async (req, res) => {
    try {
        const { suiteId } = req.params;
        const executions = await executionModel.getBySuiteId(suiteId);

        return res.json(executions);
    } catch (error) {
        console.error('Get suite executions error:', error);
        return res.status(500).json({
            error: 'Failed to get suite executions',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/execution/command - Execute single command (placeholder/mock)
router.post('/command', async (req, res) => {
    try {
        const command: PlaywrightCommand = req.body;

        // Validate command structure
        if (!command || !command.type) {
            return res.status(400).json({
                success: false,
                error: 'Invalid command: type is required',
            } as CommandExecutionResult);
        }

        // Simulate execution delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock execution logic based on command type
        let result: CommandExecutionResult;

        switch (command.type) {
            case 'navigate':
                if (!command.value) {
                    result = {
                        success: false,
                        error: 'Navigate command requires a URL value',
                        duration: 250,
                    };
                } else {
                    result = {
                        success: true,
                        output: `Navigated to ${command.value}`,
                        duration: 450,
                    };
                }
                break;

            case 'click':
                if (!command.selector) {
                    result = {
                        success: false,
                        error: 'Click command requires a selector',
                        duration: 200,
                    };
                } else {
                    result = {
                        success: true,
                        output: `Clicked element: ${command.selector}`,
                        duration: 350,
                    };
                }
                break;

            case 'fill':
            case 'type':
                if (!command.selector || !command.value) {
                    result = {
                        success: false,
                        error: 'Fill/Type command requires selector and value',
                        duration: 200,
                    };
                } else {
                    result = {
                        success: true,
                        output: `Filled ${command.selector} with "${command.value}"`,
                        duration: 400,
                    };
                }
                break;

            case 'assert':
                if (!command.selector) {
                    result = {
                        success: false,
                        error: 'Assert command requires a selector',
                        duration: 150,
                    };
                } else {
                    result = {
                        success: true,
                        output: `Assertion passed for ${command.selector}`,
                        duration: 300,
                    };
                }
                break;

            case 'wait':
                result = {
                    success: true,
                    output: command.selector
                        ? `Waited for selector: ${command.selector}`
                        : `Waited for ${command.value || 1000}ms`,
                    duration: parseInt(command.value as string || '1000', 10),
                };
                break;

            case 'screenshot':
                result = {
                    success: true,
                    output: 'Screenshot captured (mock)',
                    duration: 250,
                };
                break;

            default:
                result = {
                    success: false,
                    error: `Unknown command type: ${command.type}`,
                    duration: 100,
                };
        }

        return res.json(result);
    } catch (error) {
        console.error('Execute command error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Execution failed',
        } as CommandExecutionResult);
    }
});

export default router;
