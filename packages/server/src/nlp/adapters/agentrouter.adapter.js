"use strict";
/**
 * AgentRouter adapter for intelligent routing between LLM providers
 * Routes requests based on cost, performance, or balanced strategy
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
exports.AgentRouterAdapter = void 0;
var base_1 = require("./base");
var AgentRouterAdapter = /** @class */ (function (_super) {
    __extends(AgentRouterAdapter, _super);
    function AgentRouterAdapter(config) {
        var _this = _super.call(this, config) || this;
        _this.name = 'agentrouter';
        _this.apiKey = config.apiKey;
        _this.endpoint = config.endpoint || 'https://api.agentrouter.com/v1';
        _this.routingStrategy = config.routingStrategy || 'balanced';
        return _this;
    }
    AgentRouterAdapter.prototype.validateConfig = function (config) {
        return Boolean(config.apiKey && config.endpoint);
    };
    AgentRouterAdapter.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch("".concat(this.endpoint, "/health"), {
                                headers: {
                                    'Authorization': "Bearer ".concat(this.apiKey),
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.ok];
                    case 2:
                        error_1 = _a.sent();
                        console.error("AgentRouter health check failed:", error_1.message);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AgentRouterAdapter.prototype.parse = function (input, context) {
        return __awaiter(this, void 0, void 0, function () {
            var messages, response, error, data, rawResponse, error_2;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 5, , 6]);
                        messages = [
                            {
                                role: 'system',
                                content: this.buildSystemPrompt(),
                            },
                            {
                                role: 'user',
                                content: input,
                            },
                        ];
                        // Add context if provided
                        if ((context === null || context === void 0 ? void 0 : context.previousCommands) && context.previousCommands.length > 0) {
                            messages.splice(1, 0, {
                                role: 'assistant',
                                content: "Previous commands executed:\n".concat(JSON.stringify(context.previousCommands, null, 2)),
                            });
                        }
                        return [4 /*yield*/, fetch("".concat(this.endpoint, "/chat/completions"), {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(this.apiKey),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    messages: messages,
                                    temperature: (_b = (_a = context === null || context === void 0 ? void 0 : context.temperature) !== null && _a !== void 0 ? _a : this.config.temperature) !== null && _b !== void 0 ? _b : 0.3,
                                    max_tokens: (_d = (_c = context === null || context === void 0 ? void 0 : context.maxTokens) !== null && _c !== void 0 ? _c : this.config.maxTokens) !== null && _d !== void 0 ? _d : 2000,
                                    routing_strategy: this.routingStrategy,
                                }),
                            })];
                    case 1:
                        response = _f.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        error = _f.sent();
                        throw new Error("AgentRouter API error: ".concat(error));
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        data = _f.sent();
                        rawResponse = data.choices[0].message.content;
                        return [2 /*return*/, __assign(__assign({}, this.parseResponse(rawResponse)), { tokensUsed: (_e = data.usage) === null || _e === void 0 ? void 0 : _e.total_tokens, cost: data.cost })];
                    case 5:
                        error_2 = _f.sent();
                        throw new Error("AgentRouter parsing failed: ".concat(error_2.message));
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return AgentRouterAdapter;
}(base_1.BaseLLMAdapter));
exports.AgentRouterAdapter = AgentRouterAdapter;
