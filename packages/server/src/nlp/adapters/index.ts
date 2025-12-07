/**
 * Adapter index - exports all adapters and factory
 */

export { OpenAIAdapter } from './openai.adapter';
export { GeminiAdapter } from './gemini.adapter';
export { GLMAdapter } from './glm.adapter';
export { OpenRouterAdapter } from './openrouter.adapter';
export { AgentRouterAdapter } from './agentrouter.adapter';
export { AdapterFactory } from './factory';
export type { LLMAdapter } from '@shared/types';
