"use strict";
/**
 * Google Gemini adapter for NLP parsing
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.GeminiAdapter = void 0;
var generative_ai_1 = require("@google/generative-ai");
var base_1 = require("./base");
var GeminiAdapter = /** @class */ (function (_super) {
    __extends(GeminiAdapter, _super);
    function GeminiAdapter(config) {
        var _this = _super.call(this, config) || this;
        _this.name = 'gemini';
        _this.client = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
        _this.model = config.model || 'gemini-pro';
        return _this;
    }
    GeminiAdapter.prototype.validateConfig = function (config) {
        return Boolean(config.apiKey && config.model);
    };
    GeminiAdapter.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var model, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        model = this.client.getGenerativeModel({ model: this.model });
                        return [4 /*yield*/, model.generateContent('test')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Gemini health check failed:", error_1.message);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GeminiAdapter.prototype.parse = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var model, prompt_1, result, response, rawResponse, error_2;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 3, , 4]);
                        model = this.client.getGenerativeModel({
                            model: this.model,
                            generationConfig: {
                                temperature: (_b = (_a = context === null || context === void 0 ? void 0 : context.temperature) !== null && _a !== void 0 ? _a : this.config.temperature) !== null && _b !== void 0 ? _b : 0.3,
                                maxOutputTokens: (_d = (_c = context === null || context === void 0 ? void 0 : context.maxTokens) !== null && _c !== void 0 ? _c : this.config.maxTokens) !== null && _d !== void 0 ? _d : 2000,
                            },
                        });
                        prompt_1 = this.buildSystemPrompt() + '\n\n';
                        // Add context if provided
                        if ((context === null || context === void 0 ? void 0 : context.previousCommands) && context.previousCommands.length > 0) {
                            prompt_1 += "Previous commands executed:\n".concat(JSON.stringify(context.previousCommands, null, 2), "\n\n");
                        }
                        prompt_1 += "User request: ".concat(input, "\n\nRespond with ONLY the JSON object:");
                        return [4 /*yield*/, model.generateContent(prompt_1)];
                    case 1:
                        result = _e.sent();
                        return [4 /*yield*/, result.response];
                    case 2:
                        response = _e.sent();
                        rawResponse = response.text();
                        return [2 /*return*/, this.parseResponse(rawResponse)];
                    case 3:
                        error_2 = _e.sent();
                        throw new Error("Gemini parsing failed: ".concat(error_2.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return GeminiAdapter;
}(base_1.BaseLLMAdapter));
exports.GeminiAdapter = GeminiAdapter;
