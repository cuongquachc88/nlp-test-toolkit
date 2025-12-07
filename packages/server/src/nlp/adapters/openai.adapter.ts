/**
 * OpenAI GPT adapter for NLP parsing
 */

import OpenAI from 'openai';
import { BaseLLMAdapter } from './base';
import type {
    OpenAIConfig,
    ParseContext,
    ParseResult,
} from '@shared/types';

export class OpenAIAdapter extends BaseLLMAdapter {
    readonly name = 'openai';
    private client: OpenAI;
    private model: string;

    constructor(config: OpenAIConfig) {
        super(config);
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
        this.model = config.model || 'gpt-4';
    }

    validateConfig(config: OpenAIConfig): boolean {
        return Boolean(config.apiKey && config.model);
    }

    async healthCheck(): Promise<boolean> {
        try {
            await this.client.models.retrieve(this.model);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`OpenAI health check failed:`, errorMessage);
            return false;
        }
    }

    async parse(input: string, context?: ParseContext): Promise<ParseResult> {
        console.log('🤖 [OpenAI Adapter] Using model:', this.model);
        try {
            const systemPrompt = this.buildSystemPrompt();
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ];

            // Add conversation history if provided
            if (context?.conversationHistory && context.conversationHistory.length > 0) {
                console.log('[OpenAI] Adding conversation history:', context.conversationHistory.length, 'messages');
                messages.push(...context.conversationHistory as OpenAI.Chat.ChatCompletionMessageParam[]);
            }

            // Add current user message
            messages.push({
                role: 'user',
                content: input,
            });

            // Debug: Log full prompt being sent to LLM
            console.log('\n=== FULL PROMPT TO LLM ===');
            console.log('System Prompt:');
            console.log(systemPrompt);
            console.log('\nMessages:');
            console.log(JSON.stringify(messages, null, 2));
            console.log('===========================\n');

            // Estimate cost before sending
            const estimatedInputTokens = Math.ceil(
                (systemPrompt.length + input.length) / 4
            );
            const estimatedCost = this.calculateCost(estimatedInputTokens);
            console.log(`[Cost Estimate] ~${estimatedInputTokens} input tokens, ~$${estimatedCost.toFixed(4)} USD`);

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages,
                temperature: context?.temperature ?? this.config.temperature ?? 0.3,
                max_completion_tokens: context?.maxTokens ?? this.config.maxTokens ?? 4000,
                response_format: { type: 'json_object' },
            });

            const rawResponse = response.choices[0].message.content || '{}';

            // Debug: Log LLM response and actual usage
            console.log('\n=== LLM RESPONSE ===');
            console.log(rawResponse);
            console.log('\n=== TOKEN USAGE ===');
            console.log(`Prompt tokens: ${response.usage?.prompt_tokens || 0}`);
            console.log(`Completion tokens: ${response.usage?.completion_tokens || 0}`);
            console.log(`Total tokens: ${response.usage?.total_tokens || 0}`);
            const actualCost = this.calculateCost(response.usage?.total_tokens || 0);
            console.log(`Actual cost: $${actualCost.toFixed(4)} USD`);
            console.log('====================\n');

            const result = this.parseResponse(rawResponse);

            return {
                ...result,
                tokensUsed: response.usage?.total_tokens,
                cost: actualCost,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`OpenAI parsing failed: ${errorMessage}`);
        }
    }

    private calculateCost(tokens: number): number {
        // GPT-4 pricing (approximate, update as needed)
        const costPer1kTokens = this.model.includes('gpt-4') ? 0.03 : 0.002;
        return (tokens / 1000) * costPer1kTokens;
    }
}
