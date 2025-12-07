/**
 * Application-wide constants
 */

export const TEST_SUITE_PREFIX = 'llmtestkit';

export const BROWSER_TIMEOUT = {
    DEFAULT: 30000,
    NAVIGATION: 60000,
    ASSERTION: 5000,
} as const;

export const LLM_CONFIG = {
    DEFAULT_TEMPERATURE: 0.3,
    DEFAULT_MAX_TOKENS: 2000,
    MIN_CONFIDENCE: 0.7,
} as const;

export const API_ROUTES = {
    CHAT: '/api/chat',
    SUITES: '/api/suites',
    EXECUTION: '/api/execution',
    WS_EXECUTION: '/ws/execution',
} as const;

export const FILE_PATHS = {
    TEST_SUITES: 'test-suites',
    SCREENSHOTS: 'screenshots',
    DATABASE: './data/llmtestkit.db',
} as const;
