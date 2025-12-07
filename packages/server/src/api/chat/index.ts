/**
 * Chat API Routes
 * Handles NLP chat interactions with conversation history
 */

import express from 'express';
import type { ChatRequest, ChatResponse } from '@shared/types';
import { NLPParser } from '@/nlp/parser';
import { chatService } from '@/services/chat.service';
import { debug } from '@/utils/debug';

const router: express.Router = express.Router();
const parser = new NLPParser();

// POST /api/chat - Send chat message
router.post('/', async (req, res) => {
    try {
        debug.section('api', 'CHAT REQUEST RECEIVED');
        debug.logObject('api', 'Request Body', req.body, 'debug');

        const request: ChatRequest = req.body;

        if (!request.message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 1. Get or create session
        const session = await chatService.getOrCreateSession(request.sessionId);
        debug.info('chat', `Using session: ${session.id}`);

        // 2. Save user message
        await chatService.saveMessage(session.id, 'user', request.message);

        // 3. Get model from environment or use default
        const model = process.env.OPENAI_MODEL || 'gpt-4';
        debug.info('chat', `Using model: ${model}`);

        // 4. Calculate token counts for context window
        const systemPromptTokens = chatService.countTokens(
            "Expert Playwright test generator...",  // Approximation
            model
        );
        const currentMessageTokens = chatService.countTokens(request.message, model);

        // 5. Get conversation history with token-aware window
        const recentMessages = await chatService.getContextWindow(
            session.id,
            model,
            systemPromptTokens,
            currentMessageTokens
        );

        const conversationHistory = chatService.formatMessagesForLLM(recentMessages) as Array<{
            role: 'user' | 'assistant';
            content: string;
        }>;

        debug.info('chat', `Retrieved ${conversationHistory.length} messages from history`);

        debug.info('chat', `Parsing message: ${request.message}`);

        // 6. Parse the message using NLP with conversation history
        const result = await parser.parse(request.message, {
            ...request.context,
            conversationHistory  // Pass history to parser
        });

        // Log parse result for debugging
        debug.section('nlp', 'PARSE RESULT');
        debug.info('nlp', `Commands: ${result.commands?.length || 0}`);
        debug.info('nlp', `Confidence: ${result.confidence}`);
        debug.debug('nlp', `Tokens Used: ${result.tokensUsed}`);
        debug.debug('cost', `Cost: $${result.cost?.toFixed(6)}`);
        debug.logObject('nlp', 'Raw Response', result.rawResponse, 'debug');

        // Check if there's an error message from LLM (for vague requests)
        const parsedResponse = result.rawResponse ? JSON.parse(result.rawResponse) : null;
        if (parsedResponse?.error) {

            // Priority 1: Check if LLM returned structured questionnaire
            if (result.questionnaire && result.commands.length === 0) {
                debug.info('chat', '📋 Returning structured questionnaire to frontend');

                // Save assistant response with questionnaire
                await chatService.saveMessage(
                    session.id,
                    'assistant',
                    result.questionnaire.message
                );

                const response: ChatResponse = {
                    messageId: Date.now().toString(),
                    content: result.questionnaire.message,
                    commands: [],
                    questionnaire: result.questionnaire,  // Pass questionnaire to frontend
                    sessionId: session.id,
                };
                return res.json(response);
            }

            // Priority 2: Check for error message (legacy fallback)
            if (parsedResponse?.error && result.commands.length === 0) {
                // Format error as a structured questionnaire (fallback for old-style responses)
                const questionnaireContent = `⚠️ **Your request needs more details**

I need specific information to generate reliable test commands. Please answer these questions:

---

### 📝 Question 1: What SEO checkpoints do you want to verify?
**Select all that apply (or describe custom checks):**

- [ ] Page title is present and contains specific text
- [ ] Meta description exists and is non-empty
- [ ] Canonical link (\`<link rel="canonical">\`) is present
- [ ] H1 heading exists and is unique
- [ ] HTML lang attribute (\`<html lang="...">\`) is set
- [ ] Meta robots tag allows indexing
- [ ] Open Graph meta tags (og:title, og:description, og:image)
- [ ] Twitter Card meta tags
- [ ] JSON-LD structured data is present
- [ ] Favicon is accessible
- [ ] Robots.txt file is accessible
- [ ] Sitemap.xml file is accessible
- [ ] Other (please specify): _______________

---

### 🔗 Question 2: What navigation links do you want to test?
**Provide the exact link text or selectors:**

Example format:
\`\`\`
- "About" (link text)
- "Blog" (link text)
- [data-testid="products-link"]
- #contact-nav-link
\`\`\`

**Your answer:**
\`\`\`
(Enter navigation links here)
\`\`\`

---

### ✅ Question 3: What should I verify on each category page?
**Select verification checks:**

- [ ] H1 heading equals the category name
- [ ] Page title contains the category name
- [ ] URL matches expected pattern (e.g., \`/category-name\`)
- [ ] Content list/grid is visible
- [ ] Breadcrumbs are present
- [ ] Page loads without 404 error
- [ ] Other (please specify): _______________

---

### 💡 **Quick Start Option**

If you're not sure, try this format:
\`\`\`
Navigate to https://quachcuong.com
Verify title contains "Quach Cuong"
Verify H1 is visible
Click "Blog" in navigation
Wait for page load
Verify URL contains "/blog"
\`\`\`

---

**LLM Feedback:** ${parsedResponse.error}

**Confidence:** ${(result.confidence * 100).toFixed(0)}%`;

                // Save assistant response
                await chatService.saveMessage(session.id, 'assistant', questionnaireContent);

                const response: ChatResponse = {
                    messageId: Date.now().toString(),
                    content: questionnaireContent,
                    commands: [],
                    sessionId: session.id,
                };
                return res.json(response);
            }
        }

        // Success path: Generate Playwright code
        const generatedCode = parser.generatePlaywrightCode(result.commands, {
            testName: 'Generated Test',
            imports: true,
        });

        const successMessage = `I've parsed your request and generated ${result.commands.length} test commands with ${(result.confidence * 100).toFixed(0)}% confidence.\n\nGenerated code:\n\`\`\`typescript\n${generatedCode}\n\`\`\``;

        // Save assistant response with commands
        await chatService.saveMessage(session.id, 'assistant', successMessage, result.commands);

        // Create response with generated code
        const response: ChatResponse = {
            messageId: Date.now().toString(),
            content: successMessage,
            commands: result.commands,
            sessionId: session.id,
        };

        return res.json(response);
    } catch (error) {
        debug.error('api', `Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return res.status(500).json({
            error: 'Failed to process message',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
