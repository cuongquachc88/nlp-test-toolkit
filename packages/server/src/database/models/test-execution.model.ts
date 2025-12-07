/**
 * Test Execution Model - Database operations for test executions
 * Updated for @libsql/client async API
 */

import { v4 as uuidv4 } from 'uuid';
import type { TestExecution, TestExecutionStatus } from '@shared/types';
import { getDatabase, type Database } from '../schema';

export class TestExecutionModel {
    private dbPromise: Promise<Database>;

    constructor() {
        this.dbPromise = getDatabase();
    }

    /**
     * Create a new test execution record
     */
    async create(suiteId: string): Promise<TestExecution> {
        const db = await this.dbPromise;
        const id = uuidv4();
        const now = new Date().toISOString();

        const execution: TestExecution = {
            id,
            suiteId,
            status: 'running',
            startedAt: new Date(now),
            screenshots: [],
            logs: '',
        };

        await db.execute({
            sql: `INSERT INTO test_executions (
                id, suite_id, status, started_at, screenshots, logs
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
                execution.id,
                execution.suiteId,
                execution.status,
                now,
                JSON.stringify(execution.screenshots),
                execution.logs,
            ],
        });

        return execution;
    }

    /**
     * Get execution by ID
     */
    async getById(id: string): Promise<TestExecution | null> {
        const db = await this.dbPromise;
        const result = await db.execute({
            sql: 'SELECT * FROM test_executions WHERE id = ?',
            args: [id],
        });

        if (!result.rows || result.rows.length === 0) return null;

        return this.rowToExecution(result.rows[0]);
    }

    /**
     * Get all executions for a test suite
     */
    async getBySuiteId(suiteId: string): Promise<TestExecution[]> {
        const db = await this.dbPromise;
        const result = await db.execute({
            sql: 'SELECT * FROM test_executions WHERE suite_id = ? ORDER BY started_at DESC',
            args: [suiteId],
        });

        return (result.rows || []).map(row => this.rowToExecution(row));
    }

    /**
     * List all test executions
     */
    async list(limit = 50, offset = 0): Promise<TestExecution[]> {
        const db = await this.dbPromise;
        const result = await db.execute({
            sql: 'SELECT * FROM test_executions ORDER BY started_at DESC LIMIT ? OFFSET ?',
            args: [limit, offset],
        });

        return (result.rows || []).map(row => this.rowToExecution(row));
    }

    /**
     * Update execution with results
     */
    async update(id: string, updates: Partial<TestExecution>): Promise<TestExecution | null> {
        const db = await this.dbPromise;
        const existing = await this.getById(id);
        if (!existing) return null;

        // Build dynamic UPDATE query based on provided fields
        // Only include fields that are explicitly provided (not undefined)
        const fields: string[] = [];
        const args: any[] = [];

        if (updates.status !== undefined) {
            fields.push('status = ?');
            args.push(updates.status);
        }

        if (updates.completedAt !== undefined) {
            fields.push('completed_at = ?');
            args.push(updates.completedAt ? updates.completedAt.toISOString() : null);
        }

        if (updates.duration !== undefined) {
            fields.push('duration = ?');
            args.push(updates.duration);
        }

        if (updates.screenshots !== undefined) {
            fields.push('screenshots = ?');
            args.push(JSON.stringify(updates.screenshots));
        }

        if (updates.logs !== undefined) {
            fields.push('logs = ?');
            args.push(updates.logs);
        }

        if (updates.error !== undefined) {
            fields.push('error = ?');
            args.push(updates.error || null);
        }

        if (fields.length === 0) {
            return existing;
        }

        args.push(id);

        await db.execute({
            sql: `UPDATE test_executions SET ${fields.join(', ')} WHERE id = ?`,
            args,
        });

        return this.getById(id);
    }

    /**
     * Delete execution
     */
    async delete(id: string): Promise<boolean> {
        const db = await this.dbPromise;
        await db.execute({
            sql: 'DELETE FROM test_executions WHERE id = ?',
            args: [id],
        });

        return true; // @libsql/client doesn't return changes count
    }

    /**
     * Convert database row to TestExecution
     */
    private rowToExecution(row: any): TestExecution {
        return {
            id: String(row.id),
            suiteId: String(row.suite_id),
            status: String(row.status) as TestExecutionStatus,
            startedAt: new Date(String(row.started_at)),
            completedAt: row.completed_at ? new Date(String(row.completed_at)) : undefined,
            duration: row.duration ? Number(row.duration) : undefined,
            screenshots: JSON.parse(String(row.screenshots || '[]')),
            logs: String(row.logs || ''),
            error: row.error ? String(row.error) : undefined,
        };
    }
}
