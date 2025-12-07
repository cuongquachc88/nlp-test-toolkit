"use strict";
/**
 * LLM Adapter Factory
 * Creates and manages adapter instances with fallback support
 */
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
exports.AdapterFactory = void 0;
var openai_adapter_1 = require("./openai.adapter");
var gemini_adapter_1 = require("./gemini.adapter");
var glm_adapter_1 = require("./glm.adapter");
var openrouter_adapter_1 = require("./openrouter.adapter");
var agentrouter_adapter_1 = require("./agentrouter.adapter");
var AdapterFactory = /** @class */ (function () {
    function AdapterFactory(config) {
        this.adapters = new Map();
        this.config = config;
        this.registerAdapters();
    }
    /**
     * Get adapter by provider name
     */
    AdapterFactory.prototype.getAdapter = function (provider) {
        var adapter = this.adapters.get(provider);
        if (!adapter) {
            throw new Error("Adapter not found: ".concat(provider));
        }
        return adapter;
    };
    /**
     * Get primary adapter with automatic fallback support
     */
    AdapterFactory.prototype.getPrimaryAdapter = function () {
        return __awaiter(this, void 0, void 0, function () {
            var primary, isPrimaryHealthy, _i, _a, fallbackName, fallback, isFallbackHealthy, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        primary = this.getAdapter(this.config.primaryProvider);
                        return [4 /*yield*/, primary.healthCheck()];
                    case 1:
                        isPrimaryHealthy = _b.sent();
                        if (isPrimaryHealthy) {
                            return [2 /*return*/, primary];
                        }
                        console.warn("Primary provider '".concat(this.config.primaryProvider, "' is unhealthy, trying fallbacks..."));
                        _i = 0, _a = this.config.fallbackProviders;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        fallbackName = _a[_i];
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        fallback = this.getAdapter(fallbackName);
                        return [4 /*yield*/, fallback.healthCheck()];
                    case 4:
                        isFallbackHealthy = _b.sent();
                        if (isFallbackHealthy) {
                            console.info("Using fallback provider: ".concat(fallbackName));
                            return [2 /*return*/, fallback];
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _b.sent();
                        console.warn("Fallback provider '".concat(fallbackName, "' failed: ").concat(error_1.message));
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        // If all fallbacks fail, return primary anyway and let it error properly
                        console.error('All LLM providers are unhealthy, using primary provider anyway');
                        return [2 /*return*/, primary];
                }
            });
        });
    };
    /**
     * Register all configured adapters
     */
    AdapterFactory.prototype.registerAdapters = function () {
        var providers = this.config.providers;
        if (providers.openai) {
            this.adapters.set('openai', new openai_adapter_1.OpenAIAdapter(providers.openai));
        }
        if (providers.gemini) {
            this.adapters.set('gemini', new gemini_adapter_1.GeminiAdapter(providers.gemini));
        }
        if (providers.glm) {
            this.adapters.set('glm', new glm_adapter_1.GLMAdapter(providers.glm));
        }
        if (providers.openrouter) {
            this.adapters.set('openrouter', new openrouter_adapter_1.OpenRouterAdapter(providers.openrouter));
        }
        if (providers.agentrouter) {
            this.adapters.set('agentrouter', new agentrouter_adapter_1.AgentRouterAdapter(providers.agentrouter));
        }
        // Validate that at least primary provider is configured
        if (!this.adapters.has(this.config.primaryProvider)) {
            throw new Error("Primary provider '".concat(this.config.primaryProvider, "' is not configured. ") +
                "Please add configuration for this provider.");
        }
        console.info("Registered ".concat(this.adapters.size, " LLM adapters: ").concat(Array.from(this.adapters.keys()).join(', ')));
    };
    /**
     * Get list of all registered provider names
     */
    AdapterFactory.prototype.getRegisteredProviders = function () {
        return Array.from(this.adapters.keys());
    };
    /**
     * Check health of all registered providers
     */
    AdapterFactory.prototype.healthCheckAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, _a, _b, name_1, adapter, _c, _d, error_2;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        results = {};
                        _i = 0, _a = this.adapters.entries();
                        _e.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], name_1 = _b[0], adapter = _b[1];
                        _e.label = 2;
                    case 2:
                        _e.trys.push([2, 4, , 5]);
                        _c = results;
                        _d = name_1;
                        return [4 /*yield*/, adapter.healthCheck()];
                    case 3:
                        _c[_d] = _e.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _e.sent();
                        results[name_1] = false;
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, results];
                }
            });
        });
    };
    return AdapterFactory;
}());
exports.AdapterFactory = AdapterFactory;
