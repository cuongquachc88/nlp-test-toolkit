"use strict";
/**
 * Load configuration from environment variables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAdapterConfig = loadAdapterConfig;
var dotenv_1 = require("dotenv");
// Load .env file
dotenv_1.default.config();
function loadAdapterConfig() {
    var primaryProvider = (process.env.PRIMARY_LLM_PROVIDER || 'openai');
    var fallbackProviders = (process.env.FALLBACK_LLM_PROVIDERS || '')
        .split(',')
        .map(function (p) { return p.trim(); })
        .filter(Boolean);
    var config = {
        primaryProvider: primaryProvider,
        fallbackProviders: fallbackProviders,
        providers: {},
    };
    // OpenAI configuration
    if (process.env.OPENAI_API_KEY) {
        config.providers.openai = {
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4',
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
        };
    }
    // Google Gemini configuration
    if (process.env.GEMINI_API_KEY) {
        config.providers.gemini = {
            apiKey: process.env.GEMINI_API_KEY,
            model: process.env.GEMINI_MODEL || 'gemini-pro',
            temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.2'),
        };
    }
    // ChatGLM configuration
    if (process.env.GLM_API_KEY) {
        config.providers.glm = {
            apiKey: process.env.GLM_API_KEY,
            model: process.env.GLM_MODEL || 'chatglm3-6b',
            endpoint: process.env.GLM_ENDPOINT || 'https://open.bigmodel.cn/api/paas/v4',
        };
    }
    // OpenRouter configuration
    if (process.env.OPENROUTER_API_KEY) {
        config.providers.openrouter = {
            apiKey: process.env.OPENROUTER_API_KEY,
            model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-opus',
        };
    }
    // AgentRouter configuration
    if (process.env.AGENTROUTER_API_KEY) {
        config.providers.agentrouter = {
            apiKey: process.env.AGENTROUTER_API_KEY,
            endpoint: process.env.AGENTROUTER_ENDPOINT || 'https://api.agentrouter.com/v1',
            routingStrategy: process.env.AGENTROUTER_STRATEGY || 'balanced',
        };
    }
    return config;
}
