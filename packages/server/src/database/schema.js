"use strict";
/**
 * Database schema and initialization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
var better_sqlite3_1 = require("better-sqlite3");
var path_1 = require("path");
var fs_1 = require("fs");
var DB_PATH = process.env.DATABASE_PATH || './data/llmtestkit.db';
function initializeDatabase() {
    // Ensure data directory exists
    var dbDir = path_1.default.dirname(DB_PATH);
    if (!fs_1.default.existsSync(dbDir)) {
        fs_1.default.mkdirSync(dbDir, { recursive: true });
    }
    var db = new better_sqlite3_1.default(DB_PATH);
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    // Create tables
    createTables(db);
    return db;
}
function createTables(db) {
    // Test Suites table
    db.exec("\n    CREATE TABLE IF NOT EXISTS test_suites (\n      id TEXT PRIMARY KEY,\n      version INTEGER NOT NULL UNIQUE,\n      name TEXT NOT NULL,\n      description TEXT,\n      nlp_input TEXT NOT NULL,\n      generated_code TEXT NOT NULL,\n      llm_provider TEXT NOT NULL,\n      llm_model TEXT NOT NULL,\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL\n    )\n  ");
    // Test Executions table
    db.exec("\n    CREATE TABLE IF NOT EXISTS test_executions (\n      id TEXT PRIMARY KEY,\n      suite_id TEXT NOT NULL,\n      status TEXT NOT NULL CHECK(status IN ('running', 'passed', 'failed', 'skipped')),\n      started_at TEXT NOT NULL,\n      completed_at TEXT,\n      duration INTEGER,\n      screenshots TEXT,\n      logs TEXT,\n      error TEXT,\n      FOREIGN KEY (suite_id) REFERENCES test_suites(id) ON DELETE CASCADE\n    )\n  ");
    // Chat Sessions table
    db.exec("\n    CREATE TABLE IF NOT EXISTS chat_sessions (\n      id TEXT PRIMARY KEY,\n      created_at TEXT NOT NULL,\n      updated_at TEXT NOT NULL\n    )\n  ");
    // Chat Messages table
    db.exec("\n    CREATE TABLE IF NOT EXISTS chat_messages (\n      id TEXT PRIMARY KEY,\n      session_id TEXT NOT NULL,\n      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),\n      content TEXT NOT NULL,\n      commands TEXT,\n      timestamp TEXT NOT NULL,\n      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE\n    )\n  ");
    // Create indexes
    db.exec("\n    CREATE INDEX IF NOT EXISTS idx_test_suites_version ON test_suites(version);\n    CREATE INDEX IF NOT EXISTS idx_test_executions_suite_id ON test_executions(suite_id);\n    CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);\n    CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);\n  ");
    console.log('Database tables created successfully');
}
// Singleton database instance
var dbInstance = null;
function getDatabase() {
    if (!dbInstance) {
        dbInstance = initializeDatabase();
    }
    return dbInstance;
}
function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
