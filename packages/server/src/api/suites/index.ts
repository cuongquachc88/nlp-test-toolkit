/**
 * Test Suites API Routes
 * Handles CRUD operations for test suites
 */

import express from 'express';
import type { CreateTestSuiteRequest, UpdateTestSuiteRequest } from '@shared/types';
import { TestSuiteModel } from '../../database/models/test-suite.model';

const router: express.Router = express.Router();
const suiteModel = new TestSuiteModel();

// POST /api/suites - Create new test suite
router.post('/', async (req, res) => {
    try {
        const request: CreateTestSuiteRequest = req.body;

        if (!request.name || !request.nlpInput || !request.generatedCode) {
            return res.status(400).json({
                error: 'Missing required fields: name, nlpInput, generatedCode'
            });
        }

        const suite = await suiteModel.create({
            name: request.name,
            description: request.description || '',
            nlpInput: request.nlpInput,
            generatedCode: request.generatedCode,
            llmProvider: request.llmProvider,
            llmModel: request.llmModel,
        });

        return res.status(201).json(suite);
    } catch (error) {
        console.error('Create suite error:', error);
        return res.status(500).json({
            error: 'Failed to create test suite',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/suites - List all test suites
router.get('/', async (_req, res) => {
    try {
        const suites = await suiteModel.list();
        return res.json(suites);
    } catch (error) {
        console.error('List suites error:', error);
        return res.status(500).json({
            error: 'Failed to list test suites',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/suites/:id - Get specific test suite
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const suite = await suiteModel.getById(id);

        if (!suite) {
            return res.status(404).json({ error: 'Test suite not found' });
        }

        return res.json(suite);
    } catch (error) {
        console.error('Get suite error:', error);
        return res.status(500).json({
            error: 'Failed to get test suite',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// PUT /api/suites/:id - Update test suite
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates: UpdateTestSuiteRequest = req.body;

        const updatedSuite = await suiteModel.update(id, updates);

        if (!updatedSuite) {
            return res.status(404).json({ error: 'Test suite not found' });
        }

        return res.json(updatedSuite);
    } catch (error) {
        console.error('Update suite error:', error);
        return res.status(500).json({
            error: 'Failed to update test suite',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// DELETE /api/suites/:id - Delete test suite
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await suiteModel.delete(id);

        if (!deleted) {
            return res.status(404).json({ error: 'Test suite not found' });
        }

        return res.json({ message: 'Test suite deleted successfully' });
    } catch (error) {
        console.error('Delete suite error:', error);
        return res.status(500).json({
            error: 'Failed to delete test suite',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
