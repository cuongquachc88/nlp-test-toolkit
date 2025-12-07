/**
 * Test Suite Model - Database operations for test suites
 * Updated for @libsql/client async API
 */

import { v4 as uuidv4 } from 'uuid';
import type { TestSuite, TestSuiteMetadata } from '@shared/types';
import { getDatabase, type Database } from '../schema';
import { TEST_SUITE_PREFIX } from '@shared/constants';
import * as fs from 'fs';
import * as path from 'path';

export class TestSuiteModel {
    private dbPromise: Promise<Database>;

    constructor() {
        this.dbPromise = getDatabase();
    }

    /**
     * Create a new test suite
     */
    async create(data: Omit<TestSuite, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<TestSuite> {
        const db = await this.dbPromise;
        const id = uuidv4();
        const now = new Date().toISOString();

        // Get next version number
        const version = await this.getNextVersion();

        const suite: TestSuite = {
            id,
            version,
            ...data,
            createdAt: new Date(now),
            updatedAt: new Date(now),
        };

        // Save to database
        await db.execute({
            sql: `INSERT INTO test_suites (
                id, version, name, description, nlp_input, generated_code,
                llm_provider, llm_model, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                suite.id,
                suite.version,
                suite.name,
                suite.description || '',
                suite.nlpInput,
                suite.generatedCode,
                suite.llmProvider,
                suite.llmModel,
                now,
                now,
            ],
        });

        // Create file system representation
        this.saveToFileSystem(suite);

        return suite;
    }

    /**
     * Get test suite by ID
     */
    async getById(id: string): Promise<TestSuite | null> {
        const db = await this.dbPromise;
        const result = await db.execute({
            sql: 'SELECT * FROM test_suites WHERE id = ?',
            args: [id],
        });

        if (!result.rows || result.rows.length === 0) return null;

        return this.rowToTestSuite(result.rows[0]);
    }

    /**
     * List all test suites
     */
    async list(limit = 100, offset = 0): Promise<TestSuite[]> {
        const db = await this.dbPromise;
        const result = await db.execute({
            sql: 'SELECT * FROM test_suites ORDER BY version DESC LIMIT ? OFFSET ?',
            args: [limit, offset],
        });

        return (result.rows || []).map(row => this.rowToTestSuite(row));
    }

    /**
     * Update test suite
     */
    async update(id: string, updates: Partial<TestSuite>): Promise<TestSuite | null> {
        const db = await this.dbPromise;
        const existing = await this.getById(id);
        if (!existing) return null;

        const now = new Date().toISOString();

        // Build dynamic UPDATE query
        const fields: string[] = [];
        const args: any[] = [];

        if (updates.name !== undefined) {
            fields.push('name = ?');
            args.push(updates.name);
        }

        if (updates.description !== undefined) {
            fields.push('description = ?');
            args.push(updates.description);
        }

        if (updates.generatedCode !== undefined) {
            fields.push('generated_code = ?');
            args.push(updates.generatedCode);
        }

        if (fields.length === 0) {
            return existing;
        }

        fields.push('updated_at = ?');
        args.push(now);
        args.push(id);

        await db.execute({
            sql: `UPDATE test_suites SET ${fields.join(', ')} WHERE id = ?`,
            args,
        });

        return this.getById(id);
    }

    /**
     * Delete test suite
     */
    async delete(id: string): Promise<boolean> {
        const db = await this.dbPromise;
        const suite = await this.getById(id);
        if (!suite) return false;

        // Delete from database
        await db.execute({
            sql: 'DELETE FROM test_suites WHERE id = ?',
            args: [id],
        });

        // Delete from file system
        this.deleteFromFileSystem(suite);

        return true;
    }

    /**
     * Get next version number
     */
    private async getNextVersion(): Promise<number> {
        const db = await this.dbPromise;
        const result = await db.execute({
            sql: 'SELECT MAX(version) as max_version FROM test_suites',
            args: [],
        });

        const maxVersion = result.rows?.[0]?.max_version;
        return (Number(maxVersion) || 0) + 1;
    }

    /**
     * Save test suite to file system
     */
    private saveToFileSystem(suite: TestSuite): void {
        const suiteDir = path.join('test-suites', `${TEST_SUITE_PREFIX}-${suite.version}`);

        // Create directory
        if (!fs.existsSync(suiteDir)) {
            fs.mkdirSync(suiteDir, { recursive: true });
        }

        // Write test file
        const testFile = path.join(suiteDir, 'test.spec.ts');
        fs.writeFileSync(testFile, suite.generatedCode);

        // Write metadata
        const metadata: TestSuiteMetadata = {
            id: suite.id,
            version: suite.version,
            name: suite.name,
            description: suite.description,
            nlpInput: suite.nlpInput,
            llmProvider: suite.llmProvider,
            llmModel: suite.llmModel,
            createdAt: suite.createdAt,
            updatedAt: suite.updatedAt,
        };

        const metadataFile = path.join(suiteDir, 'metadata.json');
        fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    }

    /**
     * Delete test suite from file system
     */
    private deleteFromFileSystem(suite: TestSuite): void {
        const suiteDir = path.join('test-suites', `${TEST_SUITE_PREFIX}-${suite.version}`);

        if (fs.existsSync(suiteDir)) {
            fs.rmSync(suiteDir, { recursive: true, force: true });
        }
    }

    /**
     * Convert database row to TestSuite
     */
    private rowToTestSuite(row: any): TestSuite {
        return {
            id: String(row.id),
            version: Number(row.version),
            name: String(row.name),
            description: String(row.description || ''),
            nlpInput: String(row.nlp_input),
            generatedCode: String(row.generated_code),
            llmProvider: String(row.llm_provider),
            llmModel: String(row.llm_model),
            createdAt: new Date(String(row.created_at)),
            updatedAt: new Date(String(row.updated_at)),
        };
    }
}
