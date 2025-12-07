/**
 * Load configuration from environment variables
 */

import dotenv from 'dotenv';
import path from 'path';
import type { AdapterConfig, LLMProviderType } from '@shared/types';

// Load .env file
dotenv.config();

export function loadAdapterConfig(): AdapterConfig {
    const primaryProvider = (process.env.PRIMARY_LLM_PROVIDER || 'openai') as LLMProviderType;
    const fallbackProviders = (process.env.FALLBACK_LLM_PROVIDERS || '')
        .split(',')
        .map(p => p.trim() as LLMProviderType)
        .filter(Boolean);

    const config: AdapterConfig = {
        primaryProvider,
        fallbackProviders,
        providers: {},
    };

    // OpenAI configuration
    if (process.env.OPENAI_API_KEY) {
        config.providers.openai = {
            apiKey: process.env.OPENAI_API_KEY,
            model: (process.env.OPENAI_MODEL || 'gpt-4') as 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo',
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        };
    }

    // Google Gemini configuration
    if (process.env.GEMINI_API_KEY) {
        config.providers.gemini = {
            apiKey: process.env.GEMINI_API_KEY,
            model: (process.env.GEMINI_MODEL || 'gemini-pro') as 'gemini-pro' | 'gemini-ultra',
            temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.2'),
        };
    }

    // ChatGLM configuration
    if (process.env.GLM_API_KEY) {
        config.providers.glm = {
            apiKey: process.env.GLM_API_KEY,
            model: (process.env.GLM_MODEL || 'chatglm3-6b') as 'chatglm-6b' | 'chatglm2-6b' | 'chatglm3-6b',
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
            model: process.env.AGENTROUTER_MODEL || 'auto',
            endpoint: process.env.AGENTROUTER_ENDPOINT || 'https://agentrouter.org/v1',
            routingStrategy: (process.env.AGENTROUTER_STRATEGY as any) || 'balanced',
        };
    }

    return config;
}
