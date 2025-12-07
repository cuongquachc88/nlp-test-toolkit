/**
 * Database schema and initialization
 */

import { createClient, Client as LibsqlClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/llmtestkit.db';

export type Database = LibsqlClient;

export async function initializeDatabase(): Promise<Database> {
  // Ensure data directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create database connection
  const db = createClient({
    url: `file:${path.resolve(DB_PATH)}`
  });

  // Enable foreign keys
  await db.execute('PRAGMA foreign_keys = ON');

  // Create tables
  await createTables(db);

  return db;
}

async function createTables(db: Database): Promise<void> {
  // Test Suites table
  await db.execute(`
        CREATE TABLE IF NOT EXISTS test_suites (
            id TEXT PRIMARY KEY,
            version INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            description TEXT,
            nlp_input TEXT NOT NULL,
            generated_code TEXT NOT NULL,
            llm_provider TEXT NOT NULL,
            llm_model TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

  // Test Executions table
  await db.execute(`
        CREATE TABLE IF NOT EXISTS test_executions (
            id TEXT PRIMARY KEY,
            suite_id TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('running', 'passed', 'failed', 'skipped')),
            started_at TEXT NOT NULL,
            completed_at TEXT,
            duration INTEGER,
            screenshots TEXT,
            logs TEXT,
            error TEXT,
            FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE
        )
    `);

  // Chat Sessions table
  await db.execute(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

  // Chat Messages table
  await db.execute(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            commands TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
        )
    `);

  // Create indexes
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_test_suites_version ON test_suites(version)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_test_executions_suite_id ON test_executions(suite_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)`);

  console.log('Database tables created successfully');
}

// Singleton database instance
let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await initializeDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
