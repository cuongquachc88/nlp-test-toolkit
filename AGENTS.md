# AGENTS.md - AI Agent Instructions

> **Purpose**: This document provides instructions and context for AI agents working on the NLP Test Toolkit project.

---

## Memory & Context

### Primary Context Source

**Always reference**: [tech-specs.md](file:///Users/cuongquachc/Projects/nlp-test-toolkit/docs/tech-specs.md)

The `tech-specs.md` document is the **single source of truth** for project context. Before making any code changes or architectural decisions, review this document to understand:

- Project structure and architecture
- Technology stack and conventions
- Implementation history and decisions
- Database schema and API contracts
- Environment configuration

**Current Implementation Status** (as of 2025-12-06):
- ✅ **Phase 0**: Planning complete
- 🚧 **Phase 1**: Backend core (75% complete)
  - ✅ Multi-adapter LLM system (5 providers)
  - ✅ Shared types package
  - 🚧 NLP parser, database, API, automation engine
- 📋 **Phase 2**: Frontend (Planned - see [frontend_plan.md](file:///Users/cuongquachc/.gemini/antigravity/brain/fef2f1e9-0f57-4bfb-b589-956f12808765/frontend_plan.md))

### Context Update Protocol

After completing any implementation phase:

1. **Update tech-specs.md** with:
   - What was implemented
   - Key decisions made
   - New files/modules added
   - Updated architecture diagrams (if applicable)
   - Lessons learned

2. **Increment version** in Implementation History section

3. **Add summary** to the phase-specific section

---

## Working Principles

### 1. Context-Aware Development

- ✅ **DO**: Read tech-specs.md before starting work
- ✅ **DO**: Verify your changes align with conventions
- ✅ **DO**: Update documentation after implementation
- ❌ **DON'T**: Assume architectural patterns - always verify
- ❌ **DON'T**: Introduce new technologies without updating tech-specs

### 2. Test Suite Management

When creating or modifying test suites:

- Follow versioning convention: `llmtestkit-{N}`
- Always include all required files:
  - `metadata.json`
  - `test.nlp` (natural language description)
  - `test.ts` (generated Playwright code)
  - `screenshots/` folder (if applicable)
- Update database with suite metadata
- Increment version number sequentially

### 3. Code Consistency

Follow conventions defined in tech-specs.md:

```typescript
// ✅ Good - Follows conventions
import { Page } from 'playwright';
import { LLMAdapter } from '@/nlp/adapters/base';
import type { TestSuite } from '@shared/types';

export class TestRunner {
  private readonly browser: Page;
  
  async runTest(suite: TestSuite): Promise<void> {
    // Implementation
  }
}
```

```typescript
// ❌ Bad - Violates conventions
const TestRunner = function(browser) {
  this.browser = browser
}
```

### 4. Multi-LLM Adapter Pattern

When working with LLM adapters:

- All adapters implement `LLMAdapter` interface
- Use factory pattern for adapter creation
- Support fallback providers
- Handle errors gracefully
- Log token usage and costs

```typescript
// Example adapter usage
const factory = new AdapterFactory(config);
const adapter = await factory.getPrimaryAdapter();

try {
  const result = await adapter.parse(nlpInput);
  // Use result
} catch (error) {
  // Fallback or error handling
}
```

### 5. Conversational UI Implementation

When building chatbox features:

- Maintain conversation context across messages
- Parse user intent accurately
- Provide clear, actionable responses
- Show live preview of generated tests
- Support iterative refinement

---

## Common Tasks

### Adding a New LLM Adapter

1. Create adapter file: `packages/server/src/nlp/adapters/{provider}.adapter.ts`
2. Implement `LLMAdapter` interface
3. Register in `factory.ts`
4. Add configuration to `AdapterConfig` type
5. Update `.env.example` with new variables
6. Add to tech-specs.md under "Technology Stack"
7. Test with sample inputs

### Creating a New API Endpoint

1. Add route in `packages/server/src/api/{module}/`
2. Implement controller logic
3. Add TypeScript types in `@shared/types`
4. Update API documentation in tech-specs.md
5. Add validation middleware
6. Write tests
7. Update frontend service layer

### Implementing a New Feature

1. **Review** tech-specs.md for context
2. **Plan** - Update implementation_plan.md
3. **Code** - Follow conventions
4. **Test** - Write automated tests
5. **Document** - Update tech-specs.md
6. **Verify** - Ensure integration works

---

## File Organization

### Where to Put New Code

| Code Type | Location | Example |
|-----------|----------|---------|
| React Component | `packages/web/src/components/` | `ChatBox.tsx` |
| API Route | `packages/server/src/api/{module}/` | `api/suites/routes.ts` |
| LLM Adapter | `packages/server/src/nlp/adapters/` | `openai.adapter.ts` |
| Shared Type | `packages/shared/src/` | `types.ts` |
| Database Model | `packages/server/src/database/models/` | `test-suite.model.ts` |
| Utility Function | `packages/{package}/src/utils/` | `string-utils.ts` |
| Test File | Co-located with source | `parser.test.ts` |

---

## Error Handling Standards

### Backend (Node.js)

```typescript
// ✅ Good - Proper error handling
async function executeTest(suite: TestSuite): Promise<TestResult> {
  try {
    const result = await runner.run(suite);
    return result;
  } catch (error) {
    logger.error('Test execution failed', { 
      suiteId: suite.id, 
      error: error.message 
    });
    
    if (error instanceof PlaywrightError) {
      throw new TestExecutionError('Browser automation failed', { cause: error });
    }
    
    throw error;
  }
}
```

### Frontend (React)

```typescript
// ✅ Good - Error boundaries and user feedback
try {
  const result = await api.runTest(suiteId);
  setTestResult(result);
} catch (error) {
  toast.error('Failed to run test. Please try again.');
  console.error('Test execution error:', error);
}
```

---

## Testing Guidelines

### Unit Tests

- Test business logic in isolation
- Mock external dependencies (LLM APIs, database)
- Aim for >80% coverage on critical paths

### Integration Tests

- Test API endpoints end-to-end
- Use test database
- Verify adapter integrations

### E2E Tests

- Test complete user flows
- Verify chatbox conversations
- Test real browser automation

---

## Performance Considerations

1. **LLM API Calls**: Cache results when possible
2. **Database Queries**: Use indexes on frequently queried fields
3. **Browser Sessions**: Reuse browser contexts when safe
4. **Frontend**: Lazy load Monaco Editor and heavy components
5. **WebSocket**: Use for real-time test execution updates

---

## Security Best Practices

1. **API Keys**: Never commit to version control
2. **Input Validation**: Sanitize all user inputs
3. **SQL Injection**: Use parameterized queries
4. **XSS Protection**: Sanitize rendered content
5. **CORS**: Configure appropriately for production

---

## Debugging Tips

### LLM Adapter Issues

- Enable debug logging: `DEBUG=llm:* npm run dev`
- Check API key validity
- Verify prompt format matches provider expectations
- Test with simple inputs first

### Browser Automation Issues

- Run in headful mode: `HEADLESS=false npm test`
- Use Playwright Inspector: `PWDEBUG=1 npm test`
- Check selector specificity
- Verify waits and timeouts

### Database Issues

- Check SQLite file permissions
- Verify schema migrations ran
- Use DB browser for manual inspection

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API keys validated
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Logging configured
- [ ] Performance monitoring enabled
- [ ] Documentation updated

---

## Getting Help

### Resources

1. **Project Docs**: Start with tech-specs.md
2. **Implementation Plan**: See implementation_plan.md
3. **Architecture**: See adapter_architecture.md
4. **Code**: Read existing implementations for patterns

### When Stuck

1. Check tech-specs.md for conventions
2. Review similar existing code
3. Check error logs and stack traces
4. Test in isolation to narrow down issue
5. Ask for clarification on ambiguous requirements

---

## Agent Workflow Example

**Scenario**: Implementing a new test suite save feature

1. **Read Context**:
   ```
   - Review tech-specs.md > Test Suite Management
   - Check current API endpoints
   - Verify database schema
   ```

2. **Plan**:
   ```
   - Add POST /api/suites endpoint
   - Create file structure for llmtestkit-{N}
   - Update database with metadata
   - Return suite ID to frontend
   ```

3. **Implement**:
   ```typescript
   // Follow conventions from tech-specs.md
   // Use existing patterns from similar endpoints
   // Add proper error handling
   ```

4. **Test**:
   ```bash
   # Write tests
   npm test
   
   # Manual verification
   curl -X POST http://localhost:3000/api/suites \
     -H "Content-Type: application/json" \
     -d '{"name": "Login Test", ...}'
   ```

5. **Document**:
   ```markdown
   # Update tech-specs.md > Implementation History
   - Added test suite save functionality
   - Implemented versioning system
   - Created file structure in test-suites/
   ```

---

## Version

- **Document Version**: 1.0.0
- **Last Updated**: 2025-12-06
- **Maintained By**: Project contributors and AI agents
