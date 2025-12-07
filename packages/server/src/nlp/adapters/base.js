"use strict";
/**
 * Base adapter interface for LLM providers
 * All adapters must implement this interface
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseLLMAdapter = void 0;
var BaseLLMAdapter = /** @class */ (function () {
    function BaseLLMAdapter(config) {
        this.config = config;
        if (!this.validateConfig(config)) {
            throw new Error("Invalid configuration for ".concat(this.name, " adapter"));
        }
    }
    /**
     * Build system prompt for test generation
     */
    BaseLLMAdapter.prototype.buildSystemPrompt = function () {
        return "You are an expert test automation assistant. Your task is to convert natural language test descriptions into Playwright browser automation commands.\n\nIMPORTANT RULES:\n1. Output ONLY valid JSON matching this schema\n2. Be specific with selectors - prefer data-testid, id, or unique text\n3. Add explicit waits where needed\n4. Include assertions to verify expected behavior\n\nOUTPUT SCHEMA:\n{\n  \"commands\": [\n    {\n      \"type\": \"navigate\" | \"click\" | \"type\" | \"fill\" | \"assert\" | \"wait\" | \"screenshot\" | \"select\" | \"hover\" | \"press\",\n      \"selector\": \"CSS selector or text (when applicable)\",\n      \"value\": \"value to type/fill/assert (when applicable)\",\n      \"options\": {},\n      \"description\": \"human readable description\"\n    }\n  ],\n  \"confidence\": 0.0-1.0\n}\n\nCOMMAND TYPES:\n- navigate: Go to URL (value = URL)\n- click: Click element (selector required)\n- type: Type text (selector + value required)\n- fill: Fill input field (selector + value required)\n- assert: Verify element/text (selector + value for expected text)\n- wait: Wait for element or duration (selector OR value=duration in seconds)\n- screenshot: Take screenshot (optional selector for specific element)\n- select: Select dropdown option (selector + value)\n- hover: Hover over element (selector required)\n- press: Press keyboard key (value = key name)\n\nEXAMPLE INPUT: \"Go to google.com, search for 'playwright', and click the first result\"\n\nEXAMPLE OUTPUT:\n{\n  \"commands\": [\n    {\n      \"type\": \"navigate\",\n      \"value\": \"https://google.com\",\n      \"description\": \"Navigate to Google homepage\"\n    },\n    {\n      \"type\": \"fill\",\n      \"selector\": \"textarea[name='q']\",\n      \"value\": \"playwright\",\n      \"description\": \"Fill search box with 'playwright'\"\n    },\n    {\n      \"type\": \"press\",\n      \"value\": \"Enter\", \n      \"description\": \"Submit search\"\n    },\n    {\n      \"type\": \"wait\",\n      \"selector\": \"#search\",\n      \"description\": \"Wait for search results\"\n    },\n    {\n      \"type\": \"click\",\n      \"selector\": \"#search .g:first-child a\",\n      \"description\": \"Click first search result\"\n    }\n  ],\n  \"confidence\": 0.95\n}";
    };
    /**
     * Parse LLM response to extract commands
     */
    BaseLLMAdapter.prototype.parseResponse = function (rawResponse) {
        try {
            // Try to extract JSON from markdown code blocks if present
            var jsonMatch = rawResponse.match(/```json\\n([\\s\\S]*?)\\n```/) ||
                rawResponse.match(/```\\n([\\s\\S]*?)\\n```/);
            var jsonString = jsonMatch ? jsonMatch[1] : rawResponse;
            var parsed = JSON.parse(jsonString);
            return {
                commands: parsed.commands || [],
                confidence: parsed.confidence || 0.8,
                rawResponse: rawResponse,
            };
        }
        catch (error) {
            throw new Error("Failed to parse LLM response: ".concat(error.message, "\\nRaw response: ").concat(rawResponse));
        }
    };
    return BaseLLMAdapter;
}());
exports.BaseLLMAdapter = BaseLLMAdapter;
