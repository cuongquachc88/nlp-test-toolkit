/**
 * AgentRouter adapter for intelligent routing between LLM providers
 * Routes requests based on cost, performance, or balanced strategy
 */

import { BaseLLMAdapter } from './base';
import type {
    AgentRouterConfig,
    ParseContext,
    ParseResult,
} from '@shared/types';

export class AgentRouterAdapter extends BaseLLMAdapter {
    readonly name = 'agentrouter';
    private apiKey: string;
    private endpoint: string;
    private routingStrategy: string;

    constructor(config: AgentRouterConfig) {
        super(config);
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://agentrouter.org/v1';
        this.routingStrategy = config.routingStrategy || 'balanced';
    }

    validateConfig(config: AgentRouterConfig): boolean {
        return Boolean(config.apiKey && config.endpoint);
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.endpoint}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            return response.ok;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`AgentRouter health check failed:`, errorMessage);
            return false;
        }
    }

    async parse(input: string, context?: ParseContext): Promise<ParseResult> {
        try {
            const messages = [
                {
                    role: 'system',
                    content: this.buildSystemPrompt(),
                },
                {
                    role: 'user',
                    content: input,
                },
            ];

            // Add context if provided
            if (context?.previousCommands && context.previousCommands.length > 0) {
                messages.splice(1, 0, {
                    role: 'assistant',
                    content: `Previous commands executed:\n${JSON.stringify(context.previousCommands, null, 2)}`,
                });
            }

            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages,
                    temperature: context?.temperature ?? this.config.temperature ?? 0.3,
                    max_tokens: context?.maxTokens ?? this.config.maxTokens ?? 2000,
                    routing_strategy: this.routingStrategy,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`AgentRouter API error: ${error}`);
            }

            const data = await response.json() as any;
            const rawResponse = data.choices[0].message.content;

            return {
                ...this.parseResponse(rawResponse),
                tokensUsed: data.usage?.total_tokens,
                cost: data.cost,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`AgentRouter parsing failed: ${errorMessage}`);
        }
    }
}
