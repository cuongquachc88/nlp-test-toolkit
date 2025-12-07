/**
 * Server Entry Point
 * Express server for NLP Test Toolkit backend
 */

import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/schema';
import chatRouter from './api/chat';
import suitesRouter from './api/suites';
import executionRouter from './api/execution';
import { debug } from './utils/debug';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase().then(() => {
    debug.info('server', '✅ Database initialized successfully');
}).catch(err => {
    debug.error('server', `❌ Database initialization failed: ${err.message}`);
});

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'NLP Test Toolkit API is running' });
});

// API routes
app.use('/api/chat', chatRouter);
app.use('/api/suites', suitesRouter);
app.use('/api/execution', executionRouter);

app.get('/api/status', (_req, res) => {
    res.json({
        status: 'ready',
        adapters: ['openai', 'gemini', 'glm', 'openrouter', 'agentrouter']
    });
});

// Start server
app.listen(PORT, () => {
    debug.info('server', `🚀 Server running on http://localhost:${PORT}`);
    debug.info('server', `📊 Health check: http://localhost:${PORT}/health`);
    debug.info('server', `🔌 API status: http://localhost:${PORT}/api/status`);
    debug.info('server', `💬 Chat API: http://localhost:${PORT}/api/chat`);
});
