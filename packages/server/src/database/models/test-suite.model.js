"use strict";
/**
 * Test Suite Model - Database operations for test suites
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSuiteModel = void 0;
var uuid_1 = require("uuid");
var schema_1 = require("../schema");
var constants_1 = require("@shared/constants");
var fs = require("fs");
var path = require("path");
var TestSuiteModel = /** @class */ (function () {
    function TestSuiteModel() {
        this.db = (0, schema_1.getDatabase)();
    }
    /**
     * Create a new test suite
     */
    TestSuiteModel.prototype.create = function (data) {
        var id = (0, uuid_1.v4)();
        var now = new Date().toISOString();
        // Get next version number
        var version = this.getNextVersion();
        var suite = __assign(__assign({ id: id, version: version }, data), { createdAt: new Date(now), updatedAt: new Date(now) });
        // Insert into database
        var stmt = this.db.prepare("\n      INSERT INTO test_suites (\n        id, version, name, description, nlp_input, generated_code,\n        llm_provider, llm_model, created_at, updated_at\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ");
        stmt.run(suite.id, suite.version, suite.name, suite.description, suite.nlpInput, suite.generatedCode, suite.llmProvider, suite.llmModel, now, now);
        // Save to file system
        this.saveToFileSystem(suite);
        return suite;
    };
    /**
     * Get test suite by ID
     */
    TestSuiteModel.prototype.getById = function (id) {
        var row = this.db.prepare("\n      SELECT * FROM test_suites WHERE id = ?\n    ").get(id);
        if (!row)
            return null;
        return this.rowToTestSuite(row);
    };
    /**
     * Get test suite by version number
     */
    TestSuiteModel.prototype.getByVersion = function (version) {
        var row = this.db.prepare("\n      SELECT * FROM test_suites WHERE version = ?\n    ").get(version);
        if (!row)
            return null;
        return this.rowToTestSuite(row);
    };
    /**
     * List all test suites
     */
    TestSuiteModel.prototype.list = function () {
        var _this = this;
        var rows = this.db.prepare("\n      SELECT * FROM test_suites ORDER BY version DESC\n    ").all();
        return rows.map(function (row) { return _this.rowToTestSuite(row); });
    };
    /**
     * Update test suite
     */
    TestSuiteModel.prototype.update = function (id, updates) {
        var existing = this.getById(id);
        if (!existing)
            return null;
        var now = new Date().toISOString();
        var stmt = this.db.prepare("\n      UPDATE test_suites SET\n        name = ?,\n        description = ?,\n        nlp_input = ?,\n        generated_code = ?,\n        updated_at = ?\n      WHERE id = ?\n    ");
        stmt.run(updates.name || existing.name, updates.description || existing.description, updates.nlpInput || existing.nlpInput, updates.generatedCode || existing.generatedCode, now, id);
        var updated = this.getById(id);
        // Update file system
        this.saveToFileSystem(updated);
        return updated;
    };
    /**
     * Delete test suite
     */
    TestSuiteModel.prototype.delete = function (id) {
        var suite = this.getById(id);
        if (!suite)
            return false;
        // Delete from database
        this.db.prepare("DELETE FROM test_suites WHERE id = ?").run(id);
        // Delete from file system
        this.deleteFromFileSystem(suite);
        return true;
    };
    /**
     * Get next version number
     */
    TestSuiteModel.prototype.getNextVersion = function () {
        var result = this.db.prepare("\n      SELECT MAX(version) as max_version FROM test_suites\n    ").get();
        return (result.max_version || 0) + 1;
    };
    /**
     * Save test suite to file system
     */
    TestSuiteModel.prototype.saveToFileSystem = function (suite) {
        var suiteDir = path.join('test-suites', "".concat(constants_1.TEST_SUITE_PREFIX, "-").concat(suite.version));
        // Create directory
        fs.mkdirSync(suiteDir, { recursive: true });
        fs.mkdirSync(path.join(suiteDir, 'screenshots'), { recursive: true });
        // Save metadata
        var metadata = {
            id: suite.id,
            version: suite.version,
            name: suite.name,
            description: suite.description,
            llmProvider: suite.llmProvider,
            model: suite.llmModel,
            createdAt: suite.createdAt.toISOString(),
            nlpInput: suite.nlpInput,
        };
        fs.writeFileSync(path.join(suiteDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
        // Save natural language description
        fs.writeFileSync(path.join(suiteDir, 'test.nlp'), suite.nlpInput);
        // Save generated Playwright code
        fs.writeFileSync(path.join(suiteDir, 'test.ts'), suite.generatedCode);
    };
    /**
     * Delete test suite from file system
     */
    TestSuiteModel.prototype.deleteFromFileSystem = function (suite) {
        var suiteDir = path.join('test-suites', "".concat(constants_1.TEST_SUITE_PREFIX, "-").concat(suite.version));
        if (fs.existsSync(suiteDir)) {
            fs.rmSync(suiteDir, { recursive: true, force: true });
        }
    };
    /**
     * Convert database row to TestSuite
     */
    TestSuiteModel.prototype.rowToTestSuite = function (row) {
        return {
            id: row.id,
            version: row.version,
            name: row.name,
            description: row.description,
            nlpInput: row.nlp_input,
            generatedCode: row.generated_code,
            llmProvider: row.llm_provider,
            llmModel: row.llm_model,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    };
    return TestSuiteModel;
}());
exports.TestSuiteModel = TestSuiteModel;
