/**
 * Google Gemini adapter for NLP parsing
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseLLMAdapter } from './base';
import type {
    GeminiConfig,
    ParseContext,
    ParseResult,
} from '@shared/types';

export class GeminiAdapter extends BaseLLMAdapter {
    readonly name = 'gemini';
    private client: GoogleGenerativeAI;
    private model: string;

    constructor(config: GeminiConfig) {
        super(config);
        this.client = new GoogleGenerativeAI(config.apiKey);
        this.model = config.model || 'gemini-pro';
    }

    validateConfig(config: GeminiConfig): boolean {
        return Boolean(config.apiKey && config.model);
    }

    async healthCheck(): Promise<boolean> {
        try {
            const model = this.client.getGenerativeModel({ model: this.model });
            await model.generateContent('test');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Gemini health check failed:`, errorMessage);
            return false;
        }
    }

    async parse(input: string, context?: ParseContext): Promise<ParseResult> {
        try {
            const model = this.client.getGenerativeModel({
                model: this.model,
                generationConfig: {
                    temperature: context?.temperature ?? this.config.temperature ?? 0.3,
                    maxOutputTokens: context?.maxTokens ?? this.config.maxTokens ?? 2000,
                },
            });

            let prompt = this.buildSystemPrompt() + '\n\n';

            // Add context if provided
            if (context?.previousCommands && context.previousCommands.length > 0) {
                prompt += `Previous commands executed:\n${JSON.stringify(context.previousCommands, null, 2)}\n\n`;
            }

            prompt += `User request: ${input}\n\nRespond with ONLY the JSON object:`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawResponse = response.text();

            return this.parseResponse(rawResponse);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Gemini parsing failed: ${errorMessage}`);
        }
    }
}
