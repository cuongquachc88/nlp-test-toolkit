/**
 * Shared TypeScript types for NLP Test Toolkit
 */

// ============================================================================
// Test Suite Types
// ============================================================================

export interface TestSuite {
    id: string;
    version: number;
    name: string;
    description: string;
    nlpInput: string;
    generatedCode: string;
    llmProvider: string;
    llmModel: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TestSuiteMetadata {
    id: string;
    version: number;
    name: string;
    description: string;
    llmProvider: string;
    model: string;
    createdAt: string;
    nlpInput: string;
}

// ============================================================================
// Test Execution Types
// ============================================================================

export type TestExecutionStatus = 'running' | 'passed' | 'failed' | 'skipped';

export interface TestExecution {
    id: string;
    suiteId: string;
    status: TestExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    screenshots: string[];
    logs: string;
    error?: string;
}

export interface TestExecutionResult {
    id: string;
    suiteId: string;
    status: TestExecutionStatus;
    duration: number;
    screenshots: string[];
    logs: string[];
    error?: string;
}

export interface CommandExecutionResult {
    success: boolean;
    output?: string;
    error?: string;
    screenshot?: string;
    duration?: number;
}

// ============================================================================
// Playwright Command Types
// ============================================================================

export type PlaywrightCommandType =
    | 'navigate'
    | 'click'
    | 'type'
    | 'fill'
    | 'assert'
    | 'wait'
    | 'screenshot'
    | 'select'
    | 'hover'
    | 'press';

export interface PlaywrightCommand {
    type: PlaywrightCommandType;
    selector?: string;
    value?: string;
    options?: Record<string, any>;
    description?: string;
}

// ============================================================================
// NLP Parser Types
// ============================================================================
// Parse context for NLP
export interface ParseContext {
    previousCommands?: PlaywrightCommand[];
    conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    testMetadata?: Record<string, any>;
    temperature?: number;
    maxTokens?: number;
}

// Questionnaire types for dynamic forms
export interface QuestionOption {
    value: string;
    label: string;
}

export interface Question {
    id: string;
    text: string;
    type: 'single-choice' | 'multi-choice' | 'text-input';
    required: boolean;
    options?: QuestionOption[];  // for choice types
    placeholder?: string;         // for text-input
    multiline?: boolean;          // for text-input (use textarea)
}

export interface Questionnaire {
    message: string;
    questions: Question[];
}

export interface ParseResult {
    commands: PlaywrightCommand[];
    confidence: number;
    rawResponse: string;
    tokensUsed?: number;
    cost?: number;
    questionnaire?: Questionnaire;  // Dynamic questionnaire from LLM
}

// ============================================================================
// LLM Adapter Types
// ============================================================================

export type LLMProviderType = 'openai' | 'gemini' | 'glm' | 'openrouter' | 'agentrouter';

export interface LLMAdapter {
    readonly name: string;
    parse(input: string, context?: ParseContext): Promise<ParseResult>;
    validateConfig(config: ProviderConfig): boolean;
    healthCheck(): Promise<boolean>;
}

export interface ProviderConfig {
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    endpoint?: string;
    [key: string]: any;
}

export interface AdapterConfig {
    primaryProvider: LLMProviderType;
    fallbackProviders: LLMProviderType[];
    providers: {
        openai?: OpenAIConfig;
        gemini?: GeminiConfig;
        glm?: GLMConfig;
        openrouter?: OpenRouterConfig;
        agentrouter?: AgentRouterConfig;
    };
}

export interface OpenAIConfig extends ProviderConfig {
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'gpt-4-turbo';
}

export interface GeminiConfig extends ProviderConfig {
    model: 'gemini-pro' | 'gemini-ultra';
}

export interface GLMConfig extends ProviderConfig {
    model: 'chatglm-6b' | 'chatglm2-6b' | 'chatglm3-6b';
    endpoint?: string;
}

export interface OpenRouterConfig extends ProviderConfig {
    model: string;
}

export interface AgentRouterConfig extends ProviderConfig {
    endpoint: string;
    routingStrategy?: 'cost' | 'performance' | 'balanced';
}

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    commands?: PlaywrightCommand[];
    questionnaire?: Questionnaire;  // Dynamic questionnaire for vague requests
}


export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateTestSuiteRequest {
    name: string;
    description: string;
    nlpInput: string;
    generatedCode: string;
    llmProvider: string;
    llmModel: string;
}

export interface UpdateTestSuiteRequest {
    name?: string;
    description?: string;
    nlpInput?: string;
    generatedCode?: string;
}

export interface RunTestRequest {
    browser?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
}

export interface ChatRequest {
    message: string;
    sessionId?: string;
    context?: ParseContext;
}

export interface ChatResponse {
    messageId: string;
    content: string;
    commands?: PlaywrightCommand[];
    questionnaire?: Questionnaire;  // Dynamic questionnaire for vague requests
    sessionId: string;
}


// Constants are exported from constants.ts

