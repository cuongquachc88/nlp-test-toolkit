/**
 * ChatGLM adapter for NLP parsing (Zhipu AI)
 * Supports ChatGLM-6B, ChatGLM2-6B, ChatGLM3-6B
 */

import { BaseLLMAdapter } from './base';
import type {
    GLMConfig,
    ParseContext,
    ParseResult,
} from '@shared/types';

export class GLMAdapter extends BaseLLMAdapter {
    readonly name = 'glm';
    private apiKey: string;
    private endpoint: string;
    private model: string;

    constructor(config: GLMConfig) {
        super(config);
        this.apiKey = config.apiKey;
        this.endpoint = config.endpoint || 'https://open.bigmodel.cn/api/paas/v4';
        this.model = config.model || 'chatglm3-6b';
    }

    validateConfig(config: GLMConfig): boolean {
        return Boolean(config.apiKey && config.model);
    }

    async healthCheck(): Promise<boolean> {
        try {
            // Simple health check - try to make a minimal request
            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 10,
                }),
            });
            return response.ok;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`GLM health check failed:`, errorMessage);
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
                    model: this.model,
                    messages,
                    temperature: context?.temperature ?? this.config.temperature ?? 0.3,
                    max_tokens: context?.maxTokens ?? this.config.maxTokens ?? 2000,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`GLM API error: ${error}`);
            }

            const data = await response.json() as any;
            const rawResponse = data.choices[0].message.content;

            return this.parseResponse(rawResponse);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`GLM parsing failed: ${errorMessage}`);
        }
    }
}
