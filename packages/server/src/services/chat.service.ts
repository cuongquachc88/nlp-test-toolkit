/**
 * Chat Service - Manages chat sessions and message history
 * Implements sliding window context for LLM conversations
 */

import { getDatabase } from '@/database/schema';
import type { Database } from '@/database/schema';
import { encoding_for_model } from 'tiktoken';
import type { TiktokenModel } from 'tiktoken';

// OpenAI model context window limits (total tokens)
const MODEL_CONTEXT_LIMITS: Record<string, number> = {
    'gpt-4': 8192,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,
    'gpt-3.5-turbo': 16385,
    'gpt-3.5-turbo-16k': 16385,
};

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    commands?: string;  // JSON stringified commands
    timestamp: Date;
}

export interface ChatSession {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export class ChatService {
    private db: Database | null = null;

    async initialize(): Promise<void> {
        this.db = await getDatabase();
    }

    /**
     * Get or create a chat session
     */
    async getOrCreateSession(sessionId?: string): Promise<ChatSession> {
        if (!this.db) await this.initialize();

        const id = sessionId || this.generateSessionId();

        // Check if session exists
        const existing = await this.db!.execute({
            sql: 'SELECT * FROM chat_sessions WHERE id = ?',
            args: [id]
        });

        if (existing.rows.length > 0) {
            const row = existing.rows[0];
            return {
                id: row.id as string,
                createdAt: new Date(row.created_at as string),
                updatedAt: new Date(row.updated_at as string)
            };
        }

        // Create new session
        const now = new Date().toISOString();
        await this.db!.execute({
            sql: 'INSERT INTO chat_sessions (id, created_at, updated_at) VALUES (?, ?, ?)',
            args: [id, now, now]
        });

        return {
            id,
            createdAt: new Date(now),
            updatedAt: new Date(now)
        };
    }

    /**
     * Save a message to the database
     */
    async saveMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        commands?: any[]
    ): Promise<ChatMessage> {
        if (!this.db) await this.initialize();

        const id = this.generateMessageId();
        const timestamp = new Date().toISOString();
        const commandsJson = commands ? JSON.stringify(commands) : null;

        await this.db!.execute({
            sql: `INSERT INTO chat_messages (id, session_id, role, content, commands, timestamp) 
                  VALUES (?, ?, ?, ?, ?, ?)`,
            args: [id, sessionId, role, content, commandsJson, timestamp]
        });

        // Update session timestamp
        await this.db!.execute({
            sql: 'UPDATE chat_sessions SET updated_at = ? WHERE id = ?',
            args: [timestamp, sessionId]
        });

        return {
            id,
            sessionId,
            role,
            content,
            commands: commandsJson || undefined,
            timestamp: new Date(timestamp)
        };
    }

    /**
     * Get recent messages for a session (sliding window)
     */
    async getRecentMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
        if (!this.db) await this.initialize();

        const result = await this.db!.execute({
            sql: `SELECT * FROM chat_messages 
                  WHERE session_id = ? 
                  ORDER BY timestamp DESC 
                  LIMIT ?`,
            args: [sessionId, limit]
        });

        // Reverse to get chronological order (oldest first)
        return result.rows.reverse().map(row => ({
            id: row.id as string,
            sessionId: row.session_id as string,
            role: row.role as 'user' | 'assistant',
            content: row.content as string,
            commands: row.commands as string | undefined,
            timestamp: new Date(row.timestamp as string)
        }));
    }

    /**
     * Format messages for LLM context
     * Converts to simple string format for passing to LLM
     */
    formatMessagesForLLM(messages: ChatMessage[]): Array<{ role: string; content: string }> {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    /**
     * Get recent messages with token-aware window
     * Returns messages that fit within the model's context budget
     */
    async getContextWindow(
        sessionId: string,
        model: string = 'gpt-4',
        systemPromptTokens: number = 350,
        currentMessageTokens: number = 50
    ): Promise<ChatMessage[]> {
        // Get total context limit for this model
        const totalLimit = MODEL_CONTEXT_LIMITS[model] || 8192;

        // Reserve 40% for output, use 60% for input context
        const maxInputTokens = Math.floor(totalLimit * 0.6);

        // Calculate available budget for history
        const availableForHistory = maxInputTokens - systemPromptTokens - currentMessageTokens;

        console.log(`[Context] Model: ${model}, Limit: ${totalLimit}, Available for history: ${availableForHistory}`);

        return await this.getMessagesWithinBudget(sessionId, availableForHistory, model);
    }

    /**
     * Get messages that fit within token budget
     * Adds from newest to oldest until budget exhausted
     */
    private async getMessagesWithinBudget(
        sessionId: string,
        tokenBudget: number,
        model: string = 'gpt-4'
    ): Promise<ChatMessage[]> {
        // Get recent messages (fetch more than needed, then filter)
        const allMessages = await this.getRecentMessages(sessionId, 100);

        const selected: ChatMessage[] = [];
        let usedTokens = 0;

        // Add messages from newest to oldest
        for (let i = allMessages.length - 1; i >= 0; i--) {
            const msgTokens = this.countMessageTokens(allMessages[i].content, model);

            if (usedTokens + msgTokens <= tokenBudget) {
                selected.unshift(allMessages[i]);  // Add to beginning
                usedTokens += msgTokens;
            } else {
                // Budget exhausted
                const skipped = allMessages.length - selected.length;
                if (skipped > 0) {
                    console.log(`[Context] Truncated ${skipped} old messages to fit budget`);
                }
                break;
            }
        }

        console.log(`[Context] Using ${selected.length} messages (${usedTokens}/${tokenBudget} tokens)`);
        return selected;
    }

    /**
     * Count tokens in text using tiktoken (accurate)
     * OpenAI's official tokenizer
     */
    countTokens(text: string, model: string = 'gpt-4'): number {
        try {
            // Map model names to tiktoken models
            const tiktokenModel = this.mapToTiktokenModel(model);
            const encoder = encoding_for_model(tiktokenModel);
            const tokens = encoder.encode(text);
            const count = tokens.length;
            encoder.free();  // Important: free memory!
            return count;
        } catch (error) {
            // Fallback to estimation if tiktoken fails
            console.warn('[Chat Service] Tiktoken failed, using estimation:', error);
            return Math.ceil(text.length / 4);
        }
    }

    /**
     * Count tokens for a message (includes formatting overhead)
     * OpenAI adds ~4 tokens per message for role/formatting
     */
    countMessageTokens(content: string, model: string = 'gpt-4'): number {
        const contentTokens = this.countTokens(content, model);
        return contentTokens + 4;  // +4 for message formatting
    }

    /**
     * Map our model names to tiktoken model identifiers
     */
    private mapToTiktokenModel(model: string): TiktokenModel {
        // Tiktoken supports: gpt-4, gpt-3.5-turbo, text-davinci-003, etc.
        if (model.startsWith('gpt-4')) {
            return 'gpt-4';
        } else if (model.startsWith('gpt-3.5')) {
            return 'gpt-3.5-turbo';
        }
        return 'gpt-4';  // Default
    }

    /**
     * Estimate token count for text (fallback method)
     * Rule of thumb: ~4 characters = 1 token
     * @deprecated Use countTokens() for accuracy
     */
    estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Get message count for a session
     */
    async getMessageCount(sessionId: string): Promise<number> {
        if (!this.db) await this.initialize();

        const result = await this.db!.execute({
            sql: 'SELECT COUNT(*) as count FROM chat_messages WHERE session_id = ?',
            args: [sessionId]
        });

        return (result.rows[0]?.count as number) || 0;
    }

    /**
     * Delete old sessions and messages (cleanup)
     */
    async cleanupOldSessions(daysOld: number = 30): Promise<number> {
        if (!this.db) await this.initialize();

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const cutoffIso = cutoffDate.toISOString();

        const result = await this.db!.execute({
            sql: 'DELETE FROM chat_sessions WHERE updated_at < ?',
            args: [cutoffIso]
        });

        return result.rowsAffected;
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton instance
export const chatService = new ChatService();
