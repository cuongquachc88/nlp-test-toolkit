/**
 * Base adapter interface for LLM providers
 * All adapters must implement this interface
 */

import type {
  LLMAdapter,
  ProviderConfig,
  ParseContext,
  ParseResult,
} from '@shared/types';
import * as fs from 'fs';
import * as path from 'path';

export abstract class BaseLLMAdapter implements LLMAdapter {
  abstract readonly name: string;
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid configuration for adapter`);
    }
  }

  /**
   * Parse natural language input into Playwright commands
   */
  abstract parse(input: string, context?: ParseContext): Promise<ParseResult>;

  /**
   * Validate provider configuration
   */
  abstract validateConfig(config: ProviderConfig): boolean;

  /**
   * Check if provider is healthy and available
   */
  abstract healthCheck(): Promise<boolean>;

  /**
   * Minify prompt to reduce token usage
   * Removes extra whitespace and newlines while keeping readability
   */
  protected minifyPrompt(prompt: string): string {
    return prompt
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Build system prompt for test generation
   */
  protected buildSystemPrompt(): string {
    return `Expert Playwright test generator. Output valid JSON only.

TWO TYPES OF RESPONSES:

1. VAGUE REQUEST → Return questionnaire:
{
  "commands": [],
  "confidence": 0.1-0.3,
  "questionnaire": {
    "message": "Brief explanation",
    "questions": [{
      "id": "unique-id",
      "text": "Question?",
      "type": "single-choice|multi-choice|text-input",
      "required": true|false,
      "options": [{"value": "...", "label": "..."}],
      "placeholder": "...",
      "multiline": true|false
    }]
  }
}

2. CLEAR REQUEST → Return commands:
{
  "commands": [{"type": "navigate|click|fill|assert|wait|screenshot|press", "selector": "...", "value": "...", "description": "..."}],
  "confidence": 0.7-1.0
}

QUESTION TYPES:
- single-choice: Radio (one option). Example: login type
- multi-choice: Checkboxes (many options). Example: SEO checks  
- text-input: Text field. Set multiline:true for textarea

COMMON QUESTIONNAIRES:
- "test login" → login URL (text), login type (single), scenarios (multi), credentials (text)
- "test SEO" → URL (text), SEO checks (multi)
- "test search" → queries (text multiline), verifications (multi)

COMMANDS:
- navigate: Go to URL
- click: Click element (needs selector)
- fill: Fill input (needs selector + value)
- assert: Verify text/visibility (needs selector + value)
- wait: Wait for element or duration
- screenshot: Capture screen

SELECTORS: Use data-testid > aria-label > id > text > CSS

CRITICAL: Always return valid, complete JSON. Never return {}.
`;
  }

  /**
   * Parse LLM response to extract commands
   */
  protected parseResponse(rawResponse: string): ParseResult {
    try {
      // DEBUG: Write response to file since console.log isn't showing
      const debugPath = path.join(process.cwd(), 'llm-debug.log');
      const timestamp = new Date().toISOString();
      const debugContent = `\n\n=== ${timestamp} ===\nRAW RESPONSE:\n${rawResponse}\n==================\n`;
      fs.appendFileSync(debugPath, debugContent);

      // Also log to console
      console.log('\n[Base Adapter] Parsing LLM response...');

      // Strategy 1: Try to extract JSON from markdown code blocks
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) ||
        rawResponse.match(/```\n([\s\S]*?)\n```/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        fs.appendFileSync(debugPath, `PARSED (from code block): ${JSON.stringify(parsed, null, 2)}\n`);

        // Check if LLM returned an error for vague request
        if (parsed.error) {
          console.log('⚠️  [Base Adapter] LLM indicated vague/unclear request');
          console.log('Error message:', parsed.error);
        }
        if (parsed.confidence < 0.5) {
          console.log('⚠️  [Base Adapter] Low confidence response:', parsed.confidence);
        }
        if (parsed.questionnaire) {
          console.log('📋 [Base Adapter] LLM returned questionnaire with', parsed.questionnaire.questions?.length || 0, 'questions');
        }

        return {
          commands: parsed.commands || [],
          confidence: parsed.confidence || 0.8,
          questionnaire: parsed.questionnaire,  // Include questionnaire if present
          rawResponse,
        };
      }

      // Strategy 2: Try to parse the entire response as JSON
      const parsed = JSON.parse(rawResponse);
      fs.appendFileSync(debugPath, `PARSED (direct JSON): ${JSON.stringify(parsed, null, 2)}\n`);

      // Check if LLM returned an error for vague request
      if (parsed.error) {
        console.log('⚠️  [Base Adapter] LLM indicated vague/unclear request');
        console.log('Error message:', parsed.error);
      }
      if (parsed.confidence < 0.5) {
        console.log('⚠️  [Base Adapter] Low confidence response:', parsed.confidence);
      }
      if (parsed.questionnaire) {
        console.log('📋 [Base Adapter] LLM returned questionnaire with', parsed.questionnaire.questions?.length || 0, 'questions');
      }

      // Detect empty/incomplete responses
      if (!parsed.commands && !parsed.questionnaire && Object.keys(parsed).length <= 1) {
        console.error('🚨 [Base Adapter] LLM returned empty or incomplete JSON!');
        console.error('This usually means:');
        console.error('  1. The prompt is confusing the model');
        console.error('  2. The model needs clearer instructions');
        console.error('  3. Try a different model (GPT-4 vs GPT-3.5)');
        console.error('Raw response:', rawResponse);
      }

      return {
        commands: parsed.commands || [],
        confidence: parsed.confidence || 0.8,
        questionnaire: parsed.questionnaire,  // Include questionnaire if present
        rawResponse,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Base Adapter] Failed to parse LLM response:', errorMessage);
      throw new Error(`Failed to parse LLM response: ${errorMessage}\nRaw response: ${rawResponse}`);
    }
  }
}
