/**
 * LLM Adapter Factory
 * Creates and manages adapter instances with fallback support
 */

import type {
    LLMAdapter,
    AdapterConfig,
    LLMProviderType,
} from '@shared/types';
import { OpenAIAdapter } from './openai.adapter';
import { GeminiAdapter } from './gemini.adapter';
import { GLMAdapter } from './glm.adapter';
import { OpenRouterAdapter } from './openrouter.adapter';
import { AgentRouterAdapter } from './agentrouter.adapter';
import { debug } from '@/utils/debug';

export class AdapterFactory {
    private adapters: Map<string, LLMAdapter> = new Map();
    private config: AdapterConfig;

    constructor(config: AdapterConfig) {
        debug.section('llm', 'ADAPTER FACTORY INIT');
        debug.info('llm', `Primary provider: ${config.primaryProvider}`);
        debug.info('llm', `Fallback providers: ${config.fallbackProviders?.join(', ') || 'None'}`);

        this.config = config;
        this.registerAdapters();
    }

    /**
     * Get adapter by provider name
     */
    getAdapter(provider: LLMProviderType): LLMAdapter {
        const adapter = this.adapters.get(provider);
        if (!adapter) {
            throw new Error(`Adapter not found: ${provider}`);
        }
        return adapter;
    }

    /**
     * Get primary adapter with automatic fallback support
     */
    async getPrimaryAdapter(): Promise<LLMAdapter> {
        debug.section('llm', 'GETTING PRIMARY ADAPTER');
        debug.info('llm', `Using provider: ${this.config.primaryProvider}`);

        // Try primary provider
        const primary = this.getAdapter(this.config.primaryProvider);
        const isPrimaryHealthy = await primary.healthCheck();

        if (isPrimaryHealthy) {
            debug.info('llm', 'Primary provider is healthy');
            return primary;
        }

        debug.warn('llm', `Primary provider '${this.config.primaryProvider}' is unhealthy, trying fallbacks...`);

        // Try fallback providers in order
        for (const fallbackName of this.config.fallbackProviders) {
            try {
                const fallback = this.getAdapter(fallbackName);
                const isFallbackHealthy = await fallback.healthCheck();

                if (isFallbackHealthy) {
                    debug.info('llm', `Using fallback provider: ${fallbackName}`);
                    return fallback;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                debug.warn('llm', `Fallback provider '${fallbackName}' failed: ${errorMessage}`);
            }
        }

        // If all fallbacks fail, return primary anyway and let it error properly
        debug.error('llm', 'All LLM providers are unhealthy, using primary provider anyway');
        return primary;
    }

    /**
     * Register all configured adapters
     */
    private registerAdapters(): void {
        const { providers } = this.config;

        debug.section('llm', 'REGISTERING ADAPTERS');

        if (providers.openai) {
            debug.verbose('llm', 'Registering OpenAI adapter');
            this.adapters.set('openai', new OpenAIAdapter(providers.openai));
        }

        if (providers.gemini) {
            debug.verbose('llm', 'Registering Gemini adapter');
            this.adapters.set('gemini', new GeminiAdapter(providers.gemini));
        }

        if (providers.glm) {
            debug.verbose('llm', 'Registering GLM adapter');
            this.adapters.set('glm', new GLMAdapter(providers.glm));
        }

        if (providers.openrouter) {
            debug.verbose('llm', 'Registering OpenRouter adapter');
            this.adapters.set('openrouter', new OpenRouterAdapter(providers.openrouter));
        }

        if (providers.agentrouter) {
            debug.verbose('llm', 'Registering AgentRouter adapter');
            this.adapters.set('agentrouter', new AgentRouterAdapter(providers.agentrouter));
        }

        // Validate that at least primary provider is configured
        if (!this.adapters.has(this.config.primaryProvider)) {
            throw new Error(
                `Primary provider '${this.config.primaryProvider}' is not configured. ` +
                `Please add configuration for this provider.`
            );
        }

        debug.info('llm', `Registered ${this.adapters.size} LLM adapters: ${Array.from(this.adapters.keys()).join(', ')}`);
    }

    /**
     * Get list of all registered provider names
     */
    getRegisteredProviders(): string[] {
        return Array.from(this.adapters.keys());
    }

    /**
     * Check health of all registered providers
     */
    async healthCheckAll(): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {};

        for (const [name, adapter] of this.adapters.entries()) {
            try {
                results[name] = await adapter.healthCheck();
            } catch (error) {
                results[name] = false;
            }
        }

        return results;
    }
}
