/**
 * API Client for NLP Test Toolkit
 * Handles all backend communication
 */

import type {
    ChatRequest,
    ChatResponse,
    TestSuite,
    CreateTestSuiteRequest,
    RunTestRequest,
    TestExecutionResult,
    PlaywrightCommand,
    CommandExecutionResult,
} from '@shared/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class APIClient {
    /**
     * Chat endpoints
     */
    async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });

        if (!res.ok) {
            throw new Error(`Chat request failed: ${res.statusText}`);
        }

        return res.json();
    }

    /**
     * Test Suite endpoints
     */
    async getTestSuites(): Promise<TestSuite[]> {
        const res = await fetch(`${API_BASE}/api/suites`);

        if (!res.ok) {
            throw new Error(`Failed to fetch test suites: ${res.statusText}`);
        }

        return res.json();
    }

    async getTestSuite(id: string): Promise<TestSuite> {
        const res = await fetch(`${API_BASE}/api/suites/${id}`);

        if (!res.ok) {
            throw new Error(`Failed to fetch test suite: ${res.statusText}`);
        }

        return res.json();
    }

    async createTestSuite(suite: CreateTestSuiteRequest): Promise<TestSuite> {
        const res = await fetch(`${API_BASE}/api/suites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(suite),
        });

        if (!res.ok) {
            throw new Error(`Failed to create test suite: ${res.statusText}`);
        }

        return res.json();
    }

    async updateTestSuite(id: string, updates: Partial<TestSuite>): Promise<TestSuite> {
        const res = await fetch(`${API_BASE}/api/suites/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });

        if (!res.ok) {
            throw new Error(`Failed to update test suite: ${res.statusText}`);
        }

        return res.json();
    }

    async deleteTestSuite(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/api/suites/${id}`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            throw new Error(`Failed to delete test suite: ${res.statusText}`);
        }
    }

    /**
     * Execution endpoints
     */
    async runTest(suiteId: string, request: RunTestRequest): Promise<{ executionId: string; status: string; message: string }> {
        const res = await fetch(`${API_BASE}/api/execution/run/${suiteId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });

        if (!res.ok) {
            throw new Error(`Failed to run test: ${res.statusText}`);
        }

        return res.json();
    }

    async getExecutionResult(id: string): Promise<TestExecutionResult> {
        const res = await fetch(`${API_BASE}/api/execution/${id}`);

        if (!res.ok) {
            throw new Error(`Failed to fetch execution result: ${res.statusText}`);
        }

        return res.json();
    }

    async executeCommand(command: PlaywrightCommand): Promise<CommandExecutionResult> {
        const res = await fetch(`${API_BASE}/api/execution/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
        });

        if (!res.ok) {
            throw new Error(`Failed to execute command: ${res.statusText}`);
        }

        return res.json();
    }

    async getSuiteExecutions(suiteId: string): Promise<TestExecutionResult[]> {
        const res = await fetch(`${API_BASE}/api/execution/suite/${suiteId}`);

        if (!res.ok) {
            throw new Error(`Failed to fetch suite executions: ${res.statusText}`);
        }

        return res.json();
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<{ status: string; message: string }> {
        const res = await fetch(`${API_BASE}/health`);

        if (!res.ok) {
            throw new Error('Health check failed');
        }

        return res.json();
    }

    /**
     * API status
     */
    async getStatus(): Promise<{ status: string; adapters: string[] }> {
        const res = await fetch(`${API_BASE}/api/status`);

        if (!res.ok) {
            throw new Error('Status check failed');
        }

        return res.json();
    }
}

// Export singleton instance
export const apiClient = new APIClient();
