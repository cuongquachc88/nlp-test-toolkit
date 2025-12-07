"use strict";
/**
 * NLP Parser - Wrapper around LLM adapters
 * Provides simplified interface for parsing natural language to Playwright commands
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NLPParser = void 0;
var factory_1 = require("./adapters/factory");
var config_1 = require("@/utils/config");
var NLPParser = /** @class */ (function () {
    function NLPParser() {
        var config = (0, config_1.loadAdapterConfig)();
        this.factory = new factory_1.AdapterFactory(config);
    }
    /**
     * Parse natural language input into Playwright commands
     */
    NLPParser.prototype.parse = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var adapter, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.factory.getPrimaryAdapter()];
                    case 1:
                        adapter = _a.sent();
                        return [4 /*yield*/, adapter.parse(input, context)];
                    case 2:
                        result = _a.sent();
                        // Validate commands
                        this.validateCommands(result.commands);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Parse conversational input with message history
     */
    NLPParser.prototype.parseConversational = function (messages, context) {
        return __awaiter(this, void 0, void 0, function () {
            var conversationContext, latestMessage;
            var _a;
            return __generator(this, function (_b) {
                conversationContext = messages
                    .map(function (msg) { return "".concat(msg.role, ": ").concat(msg.content); })
                    .join('\n');
                latestMessage = ((_a = messages
                    .filter(function (m) { return m.role === 'user'; })
                    .pop()) === null || _a === void 0 ? void 0 : _a.content) || '';
                // Parse with conversation context
                return [2 /*return*/, this.parse(latestMessage, __assign(__assign({}, context), { testMetadata: __assign(__assign({}, context === null || context === void 0 ? void 0 : context.testMetadata), { conversationHistory: conversationContext }) }))];
            });
        });
    };
    /**
     * Generate Playwright TypeScript code from commands
     */
    NLPParser.prototype.generatePlaywrightCode = function (commands, options) {
        var testName = (options === null || options === void 0 ? void 0 : options.testName) || 'Generated Test';
        var includeImports = (options === null || options === void 0 ? void 0 : options.imports) !== false;
        var code = '';
        if (includeImports) {
            code += "import { test, expect } from '@playwright/test';\n\n";
        }
        code += "test('".concat(testName, "', async ({ page }) => {\n");
        for (var _i = 0, commands_1 = commands; _i < commands_1.length; _i++) {
            var cmd = commands_1[_i];
            code += this.commandToCode(cmd);
        }
        code += "});\n";
        return code;
    };
    /**
     * Convert a single command to Playwright code
     */
    NLPParser.prototype.commandToCode = function (cmd) {
        var indent = '  ';
        var code = '';
        // Add comment with description
        if (cmd.description) {
            code += "".concat(indent, "// ").concat(cmd.description, "\n");
        }
        switch (cmd.type) {
            case 'navigate':
                code += "".concat(indent, "await page.goto('").concat(cmd.value, "');\n");
                break;
            case 'click':
                code += "".concat(indent, "await page.click('").concat(cmd.selector, "');\n");
                break;
            case 'type':
            case 'fill':
                code += "".concat(indent, "await page.fill('").concat(cmd.selector, "', '").concat(cmd.value, "');\n");
                break;
            case 'assert':
                if (cmd.selector) {
                    code += "".concat(indent, "await expect(page.locator('").concat(cmd.selector, "')).toContainText('").concat(cmd.value, "');\n");
                }
                else {
                    code += "".concat(indent, "await expect(page).toHaveURL('").concat(cmd.value, "');\n");
                }
                break;
            case 'wait':
                if (cmd.selector) {
                    code += "".concat(indent, "await page.waitForSelector('").concat(cmd.selector, "');\n");
                }
                else if (cmd.value) {
                    var ms = parseInt(cmd.value) * 1000;
                    code += "".concat(indent, "await page.waitForTimeout(").concat(ms, ");\n");
                }
                break;
            case 'screenshot':
                if (cmd.selector) {
                    code += "".concat(indent, "await page.locator('").concat(cmd.selector, "').screenshot({ path: 'screenshot.png' });\n");
                }
                else {
                    code += "".concat(indent, "await page.screenshot({ path: 'screenshot.png' });\n");
                }
                break;
            case 'select':
                code += "".concat(indent, "await page.selectOption('").concat(cmd.selector, "', '").concat(cmd.value, "');\n");
                break;
            case 'hover':
                code += "".concat(indent, "await page.hover('").concat(cmd.selector, "');\n");
                break;
            case 'press':
                code += "".concat(indent, "await page.keyboard.press('").concat(cmd.value, "');\n");
                break;
            default:
                code += "".concat(indent, "// Unknown command type: ").concat(cmd.type, "\n");
        }
        code += '\n';
        return code;
    };
    /**
     * Validate commands for common issues
     */
    NLPParser.prototype.validateCommands = function (commands) {
        for (var _i = 0, commands_2 = commands; _i < commands_2.length; _i++) {
            var cmd = commands_2[_i];
            // Validate required fields
            if (cmd.type === 'navigate' && !cmd.value) {
                throw new Error('Navigate command requires a URL value');
            }
            if (['click', 'fill', 'type', 'select', 'hover'].includes(cmd.type) && !cmd.selector) {
                throw new Error("".concat(cmd.type, " command requires a selector"));
            }
            if (['fill', 'type', 'select'].includes(cmd.type) && !cmd.value) {
                throw new Error("".concat(cmd.type, " command requires a value"));
            }
        }
    };
    /**
     * Get available providers and their health status
     */
    NLPParser.prototype.getProviderHealth = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.factory.healthCheckAll()];
            });
        });
    };
    /**
     * Get list of registered providers
     */
    NLPParser.prototype.getProviders = function () {
        return this.factory.getRegisteredProviders();
    };
    return NLPParser;
}());
exports.NLPParser = NLPParser;
