/**
 * OpenRouter adapter for NLP parsing
 * Provides unified access to multiple LLM providers
 */

import { BaseLLMAdapter } from './base';
import type {
    OpenRouterConfig,
    ParseContext,
    ParseResult,
} from '@shared/types';

export class OpenRouterAdapter extends BaseLLMAdapter {
    readonly name = 'openrouter';
    private apiKey: string;
    private model: string;
    private endpoint = 'https://openrouter.ai/api/v1';

    constructor(config: OpenRouterConfig) {
        super(config);
        this.apiKey = config.apiKey;
        this.model = config.model || 'anthropic/claude-3-opus';
    }

    validateConfig(config: OpenRouterConfig): boolean {
        return Boolean(config.apiKey && config.model);
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.endpoint}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            return response.ok;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`OpenRouter health check failed:`, errorMessage);
            return false;
        }
    }

    async parse(input: string, context?: ParseContext): Promise<ParseResult> {
        try {
            // Don't minify for now - might be breaking the prompt
            const systemPrompt = this.buildSystemPrompt();

            const messages: any[] = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
            ];

            // Add conversation history if provided
            if (context?.conversationHistory && context.conversationHistory.length > 0) {
                messages.push(...context.conversationHistory);
            }

            // Add current user message
            messages.push({
                role: 'user',
                content: input,
            });

            // Debug: Token counting (rough estimate: ~4 chars = 1 token)
            const estimateTokens = (text: string) => Math.ceil(text.length / 4);
            const systemTokens = estimateTokens(systemPrompt);
            const userTokens = estimateTokens(input);
            const totalTokens = systemTokens + userTokens;

            // Cost estimation (OpenRouter pricing for Claude 3 Opus)
            // Input: $15/1M tokens, Output: $75/1M tokens (estimated)
            const inputCost = (totalTokens / 1_000_000) * 15;
            const estimatedOutputTokens = 500; // Rough estimate
            const outputCost = (estimatedOutputTokens / 1_000_000) * 75;
            const totalEstimatedCost = inputCost + outputCost;

            // Prepare debug output
            const debugOutput = `
=== SENDING TO OPENROUTER ===
Time: ${new Date().toISOString()}
System Prompt Length: ${systemPrompt.length} chars
System Prompt Tokens (est): ${systemTokens}
User Input: ${input}
User Input Tokens (est): ${userTokens}
Total Estimated Tokens: ${totalTokens}
Estimated Cost: $${totalEstimatedCost.toFixed(6)} (Input: $${inputCost.toFixed(6)}, Output: $${outputCost.toFixed(6)})
Model: ${this.model}

--- FULL SYSTEM PROMPT ---
${systemPrompt}
--- END SYSTEM PROMPT ---

--- FULL MESSAGES PAYLOAD ---
${JSON.stringify(messages, null, 2)}
--- END PAYLOAD ---
=============================
`;

            // Log to console
            console.log(debugOutput);

            // Also log to file for persistence
            const fs = await import('fs');
            const path = await import('path');
            const debugPath = path.join(process.cwd(), 'debug.log');
            fs.appendFileSync(debugPath, debugOutput + '\n\n');


            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://nlp-test-toolkit.app',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    temperature: context?.temperature ?? this.config.temperature ?? 0.3,
                    max_tokens: context?.maxTokens ?? this.config.maxTokens ?? 2000,
                }),
            });

            const data = await response.json() as any;

            // Debug: Log LLM response with actual cost
            const actualInputTokens = data.usage?.prompt_tokens || totalTokens;
            const actualOutputTokens = data.usage?.completion_tokens || estimatedOutputTokens;
            const actualTotalTokens = data.usage?.total_tokens || (totalTokens + estimatedOutputTokens);

            // Calculate actual cost
            const actualInputCost = (actualInputTokens / 1_000_000) * 15;
            const actualOutputCost = (actualOutputTokens / 1_000_000) * 75;
            const actualTotalCost = actualInputCost + actualOutputCost;

            // Track cost
            const { costTracker } = await import('@/services/cost-tracker');
            costTracker.addEntry({
                model: this.model,
                inputTokens: actualInputTokens,
                outputTokens: actualOutputTokens,
                totalTokens: actualTotalTokens,
                cost: actualTotalCost,
            });

            console.log('\n=== LLM RESPONSE ===');
            console.log('Status:', response.status);
            console.log('Actual Input Tokens:', actualInputTokens);
            console.log('Actual Output Tokens:', actualOutputTokens);
            console.log('Actual Total Tokens:', actualTotalTokens);
            console.log('Actual Cost: $' + actualTotalCost.toFixed(6));
            console.log('Response:', JSON.stringify(data, null, 2));
            console.log('====================\n');

            // Also log to file
            // const fs = await import('fs'); // Already imported above
            // const path = await import('path'); // Already imported above
            // const debugPath = path.join(process.cwd(), 'debug.log'); // Already defined above
            fs.appendFileSync(debugPath, `\n=== RESPONSE ===\nActual Tokens: ${actualTotalTokens} (Input: ${actualInputTokens}, Output: ${actualOutputTokens})\nActual Cost: $${actualTotalCost.toFixed(6)}\n=================\n\n`);

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${JSON.stringify(data)}`);
            }

            const content = data.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('No content in OpenRouter response');
            }

            // Debug: Log content being parsed
            console.log('\n=== PARSING CONTENT ===');
            console.log(content);
            console.log('=======================\n');

            return {
                ...this.parseResponse(content),
                tokensUsed: actualTotalTokens,
            };
        } catch (error) {
            console.error('OpenRouter error:', error);
            throw error;
        }
    }
}
