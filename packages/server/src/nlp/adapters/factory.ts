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

export class AdapterFactory {
    private adapters: Map<string, LLMAdapter> = new Map();
    private config: AdapterConfig;

    constructor(config: AdapterConfig) {
        console.log('\n=== ADAPTER FACTORY INIT ===');
        console.log('Primary provider:', config.primaryProvider);
        console.log('Fallback providers:', config.fallbackProviders?.join(', ') || 'None');
        console.log('============================\n');

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
        console.log('\n=== GETTING PRIMARY ADAPTER ===');
        console.log('Using provider:', this.config.primaryProvider);

        // Try primary provider
        const primary = this.getAdapter(this.config.primaryProvider);
        const isPrimaryHealthy = await primary.healthCheck();

        if (isPrimaryHealthy) {
            console.log('Primary provider is healthy');
            console.log('================================\n');
            return primary;
        }

        console.warn(`Primary provider '${this.config.primaryProvider}' is unhealthy, trying fallbacks...`);

        // Try fallback providers in order
        for (const fallbackName of this.config.fallbackProviders) {
            try {
                const fallback = this.getAdapter(fallbackName);
                const isFallbackHealthy = await fallback.healthCheck();

                if (isFallbackHealthy) {
                    console.info(`Using fallback provider: ${fallbackName}`);
                    console.log('================================\n');
                    return fallback;
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Fallback provider '${fallbackName}' failed: ${errorMessage}`);
            }
        }

        // If all fallbacks fail, return primary anyway and let it error properly
        console.error('All LLM providers are unhealthy, using primary provider anyway');
        console.log('================================\n');
        return primary;
    }

    /**
     * Register all configured adapters
     */
    private registerAdapters(): void {
        const { providers } = this.config;

        console.log('\n=== REGISTERING ADAPTERS ===');

        if (providers.openai) {
            console.log('Registering OpenAI adapter');
            this.adapters.set('openai', new OpenAIAdapter(providers.openai));
        }

        if (providers.gemini) {
            console.log('Registering Gemini adapter');
            this.adapters.set('gemini', new GeminiAdapter(providers.gemini));
        }

        if (providers.glm) {
            console.log('Registering GLM adapter');
            this.adapters.set('glm', new GLMAdapter(providers.glm));
        }

        if (providers.openrouter) {
            console.log('Registering OpenRouter adapter');
            this.adapters.set('openrouter', new OpenRouterAdapter(providers.openrouter));
        }

        if (providers.agentrouter) {
            console.log('Registering AgentRouter adapter');
            this.adapters.set('agentrouter', new AgentRouterAdapter(providers.agentrouter));
        }

        // Validate that at least primary provider is configured
        if (!this.adapters.has(this.config.primaryProvider)) {
            throw new Error(
                `Primary provider '${this.config.primaryProvider}' is not configured. ` +
                `Please add configuration for this provider.`
            );
        }

        console.info(`Registered ${this.adapters.size} LLM adapters: ${Array.from(this.adapters.keys()).join(', ')}`);
        console.log('============================\n');
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
