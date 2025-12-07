/**
 * Chat Hook - Manages chat state and API communication
 */

import { useState, useEffect } from 'react';
import type { ChatMessage } from '@shared/types';
import { apiClient } from '@/services/api';

export function useChat(initialSessionId?: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string>(initialSessionId || '');

    // Generate sessionId once on mount if not provided
    useEffect(() => {
        if (!sessionId) {
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            setSessionId(newSessionId);
            console.log('[useChat] Generated new session:', newSessionId);
        }
    }, [sessionId]);

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        // Add user message optimistically
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            // Send to backend with sessionId
            const response = await apiClient.sendChatMessage({
                message: content,
                sessionId,  // Use persistent sessionId
                context: {},
            });

            // Update sessionId if backend returned a new one
            if (response.sessionId && response.sessionId !== sessionId) {
                setSessionId(response.sessionId);
                console.log('[useChat] Updated session:', response.sessionId);
            }

            // Add assistant response
            const assistantMessage: ChatMessage = {
                id: response.messageId,
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
                commands: response.commands,
                ...(response.questionnaire && { questionnaire: response.questionnaire }),  // Include questionnaire if present
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
            console.error('Chat error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const clearMessages = () => {
        setMessages([]);
        setError(null);
    };

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages,
        sessionId,  // Expose sessionId for debugging
    };
}
