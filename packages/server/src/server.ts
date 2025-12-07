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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase().then(() => {
    console.log('✅ Database initialized successfully');
}).catch(err => {
    console.error('❌ Database initialization failed:', err);
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
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 API status: http://localhost:${PORT}/api/status`);
    console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
});
