# NLP Test Toolkit - Technical Specifications

> **Document Purpose**: This document serves as the central knowledge base and context for the project. All agents should reference this document to understand the project structure, architecture, and conventions.

---

## Project Overview

**Project Name**: NLP Test Toolkit (LLM TestKit)  
**Version**: 0.1.0 (Planning Phase)  
**Repository**: `/Users/cuongquachc/Projects/nlp-test-toolkit`

### Mission Statement

Create an intuitive browser automation testing toolkit that empowers testers to write and execute tests using natural language, eliminating the need for coding expertise while maintaining the power and flexibility of modern testing frameworks.

### Core Value Propositions

1. **Natural Language Interface**: Write tests by describing what you want to test in plain English
2. **Multi-LLM Support**: Flexible adapter system supporting OpenAI, Gemini, GLM, OpenRouter, and AgentRouter
3. **Conversational UI**: Chat-based interface for iterative test creation and refinement
4. **Test Suite Management**: Version-controlled test suites with reusable scenarios
5. **Cross-Browser Testing**: Powered by Playwright for reliable automation

---

## Technology Stack

### Backend
- **Runtime**: Node.js v18+
- **Language**: TypeScript 5.x
- **Web Framework**: Express.js
- **Browser Automation**: Playwright
- **Database**: SQLite (better-sqlite3)
- **LLM Clients**: 
  - `openai` - OpenAI API
  - `@google/generative-ai` - Google Gemini
  - Custom clients for GLM, OpenRouter, AgentRouter

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS
- **Code Editor**: Monaco Editor
- **Markdown**: React Markdown

### Development Tools
- **Package Manager**: pnpm (monorepo with workspaces)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Vitest, Playwright Test

---

## Project Structure

\`\`\`
nlp-test-toolkit/
├── .agent/                      # Agent configuration
│   └── workflows/               # Reusable workflows
├── packages/
│   ├── web/                     # React frontend application
│   │   ├── src/
│   │   │   ├── components/      # Reusable UI components
│   │   │   │   ├── ChatBox/     # Conversational test creation
│   │   │   │   ├── TestEditor/  # Monaco-based test editor
│   │   │   │   ├── TestRunner/  # Test execution UI
│   │   │   │   └── Dashboard/   # Main dashboard
│   │   │   ├── pages/          # Route pages
│   │   │   ├── services/       # API clients
│   │   │   ├── hooks/          # React hooks
│   │   │   ├── types/          # TypeScript types
│   │   │   └── App.tsx
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── server/                  # Express backend API
│   │   ├── src/
│   │   │   ├── api/            # REST API routes
│   │   │   │   ├── tests/      # Test CRUD endpoints
│   │   │   │   ├── suites/     # Test suite endpoints
│   │   │   │   ├── chat/       # Chatbox endpoints
│   │   │   │   └── execution/  # Test execution endpoints
│   │   │   ├── nlp/            # NLP processing
│   │   │   │   ├── adapters/   # LLM provider adapters
│   │   │   │   │   ├── base.ts
│   │   │   │   │   ├── openai.adapter.ts
│   │   │   │   │   ├── gemini.adapter.ts
│   │   │   │   │   ├── glm.adapter.ts
│   │   │   │   │   ├── openrouter.adapter.ts
│   │   │   │   │   ├── agentrouter.adapter.ts
│   │   │   │   │   └── factory.ts
│   │   │   │   ├── parser.ts   # NLP to Playwright parser
│   │   │   │   └── prompts.ts  # LLM prompts
│   │   │   ├── automation/     # Test execution engine
│   │   │   │   ├── runner.ts   # Test runner
│   │   │   │   ├── browser.ts  # Browser session mgmt
│   │   │   │   └── reporter.ts # Test reporter
│   │   │   ├── database/       # Database layer
│   │   │   │   ├── schema.ts   # DB schema
│   │   │   │   ├── migrations/ # DB migrations
│   │   │   │   └── models/     # Data models
│   │   │   └── server.ts       # Express app entry
│   │   └── package.json
│   │
│   └── shared/                  # Shared code between packages
│       ├── src/
│       │   ├── types.ts        # Common TypeScript types
│       │   └── constants.ts    # Shared constants
│       └── package.json
│
├── test-suites/                 # Saved test suites (versioned)
│   ├── llmtestkit-1/           # First test suite
│   ├── llmtestkit-2/           # Second test suite
│   └── ...
│
├── docs/                        # Project documentation
│   ├── AGENTS.md               # Agent instructions
│   ├── tech-specs.md           # This file
│   └── api/                    # API documentation
│
├── .env.example                # Environment variables template
├── package.json                # Root package.json (workspace)
├── tsconfig.json               # Root TypeScript config
├── pnpm-workspace.yaml         # pnpm workspace config
└── README.md                   # User-facing documentation
\`\`\`

---

## Architecture

### System Architecture Diagram

\`\`\`mermaid
graph TB
    subgraph "Frontend Layer"
        A[React UI]
        B[ChatBox Component]
        C[Test Editor]
        D[Dashboard]
    end
    
    subgraph "API Layer"
        E[Express Server]
        F[REST API Routes]
    end
    
    subgraph "Business Logic"
        G[NLP Parser]
        H[Adapter Factory]
        I[Test Execution Engine]
    end
    
    subgraph "Data Layer"
        J[SQLite Database]
        K[File System - Test Suites]
    end
    
    subgraph "External Services"
        L[OpenAI API]
        M[Google Gemini]
        N[ChatGLM]
        O[OpenRouter]
        P[AgentRouter]
    end
    
    subgraph "Browser Automation"
        Q[Playwright]
        R[Chrome/Firefox/Safari]
    end
    
    A --> B
    A --> C
    A --> D
    B --> F
    C --> F
    D --> F
    F --> E
    E --> G
    G --> H
    H --> L
    H --> M
    H --> N
    H --> O
    H --> P
    G --> I
    I --> Q
    Q --> R
    E --> J
    E --> K
    
    style A fill:#61dafb
    style E fill:#68a063
    style Q fill:#2EAD33
\`\`\`

### Data Flow

1. **Test Creation (Conversational)**:
   - User types natural language in ChatBox
   - Frontend sends to `/api/chat` endpoint
   - NLP Parser uses LLM adapter to parse input
   - Returns structured test steps
   - Frontend displays in chat and updates live preview
   - User can iterate until satisfied
   - Save as test suite with version (llmtestkit-N)

2. **Test Execution**:
   - User selects test suite to run
   - Frontend calls `/api/execution/run`
   - Test Execution Engine loads test suite
   - Executes each step via Playwright
   - Reports progress via WebSocket
   - Stores results in database
   - Returns screenshots and logs

3. **Test Suite Management**:
   - Each confirmed test suite saved as `llmtestkit-{N}`
   - Metadata stored in database
   - Test files stored in `/test-suites/llmtestkit-{N}/`
   - Can be loaded, edited, and reused

---

## Conventions & Guidelines

### Code Style

1. **TypeScript Strict Mode**: Always enabled
2. **Naming Conventions**:
   - Files: `kebab-case.ts`
   - Components: `PascalCase.tsx`
   - Functions/variables: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`
   - Types/Interfaces: `PascalCase`

3. **Import Order**:
   ```typescript
   // 1. External imports
   import express from 'express';
   import { Page } from 'playwright';
   
   // 2. Internal imports (absolute paths)
   import { LLMAdapter } from '@/nlp/adapters/base';
   
   // 3. Relative imports
   import { parseCommand } from './parser';
   
   // 4. Type imports
   import type { TestSuite } from '@shared/types';
   ```

4. **Error Handling**: Always use try-catch for async operations
5. **Comments**: Use JSDoc for public APIs

### Test Suite Naming

- **Pattern**: `llmtestkit-{N}` where N is sequential number
- **First suite**: `llmtestkit-1`
- **Second suite**: `llmtestkit-2`
- Each suite folder contains:
  - `metadata.json` - Suite info (name, description, created date)
  - `test.nlp` - Natural language test description
  - `test.ts` - Generated Playwright test code
  - `screenshots/` - Captured screenshots (if any)

### Database Schema

\`\`\`typescript
// Test Suites Table
interface TestSuite {
  id: string;              // UUID
  version: number;         // Sequential number (1, 2, 3...)
  name: string;            // User-provided name
  description: string;     // Test suite description
  nlpInput: string;        // Original natural language input
  generatedCode: string;   // Playwright test code
  llmProvider: string;     // Which LLM was used
  createdAt: Date;
  updatedAt: Date;
}

// Test Executions Table
interface TestExecution {
  id: string;              // UUID
  suiteId: string;         // Foreign key to TestSuite
  status: 'running' | 'passed' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;       // milliseconds
  screenshots: string[];   // Paths to screenshot files
  logs: string;            // Execution logs
  error?: string;          // Error message if failed
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send natural language message, get parsed response |
| GET | `/api/suites` | List all test suites |
| GET | `/api/suites/:id` | Get specific test suite |
| POST | `/api/suites` | Create new test suite |
| PUT | `/api/suites/:id` | Update test suite |
| DELETE | `/api/suites/:id` | Delete test suite |
| POST | `/api/execution/run` | Execute test suite |
| GET | `/api/execution/:id` | Get execution status/results |
| GET | `/api/execution/history` | Get execution history |
| WS | `/ws/execution` | WebSocket for real-time execution updates |

---

## Implementation History

### Phase 0: Planning (Complete)

**Status**: ✅ Complete

**What was done**:
- ✅ Technology stack selected (Playwright + Node.js + React)
- ✅ Multi-LLM adapter architecture designed
- ✅ Wireframes created for Dashboard, Test Editor, ChatBox, Reports
- ✅ Test suite management with versioning designed
- ✅ Project structure defined
- ✅ Documentation framework established

**Key Decisions**:
1. Chose Playwright over Puppeteer/Selenium for reliability and cross-browser support
2. Multi-adapter pattern for LLM flexibility (OpenAI, Gemini, GLM, OpenRouter, AgentRouter)
3. Conversational chatbox as primary UI for test creation
4. Version-controlled test suites (llmtestkit-1, llmtestkit-2, ...)
5. Monorepo structure with pnpm workspaces

---

### Phase 1: Backend Core (In Progress)

**Status**: 🚧 75% Complete

**Completed**:

1. **Project Infrastructure** ✅
   - Monorepo setup with pnpm workspaces
   - TypeScript configuration (strict mode)
   - 237 packages installed
   - Environment configuration template

2. **Shared Types Package** ✅ 
   - [packages/shared/src/types.ts](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/shared/src/types.ts)
   - 200+ lines of comprehensive TypeScript interfaces
   - Test suite, execution, command, and LLM adapter types
   - API request/response types

3. **Multi-Adapter LLM System** ✅
   - [Base Adapter](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/nlp/adapters/base.ts) - Abstract base class with system prompt
   - [OpenAI Adapter](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/nlp/adapters/openai.adapter.ts) - GPT-4 support, cost tracking
   - [Gemini Adapter](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/nlp/adapters/gemini.adapter.ts) - Gemini Pro support
   - [GLM Adapter](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/nlp/adapters/glm.adapter.ts) - ChatGLM support
   - [OpenRouter Adapter](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/nlp/adapters/openrouter.adapter.ts) - Multi-model access
   - [AgentRouter Adapter](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/nlp/adapters/agentrouter.adapter.ts) - Intelligent routing
   - [Adapter Factory](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/nlp/adapters/factory.ts) - Fallback support, health checks
   - [Config Loader](file:///Users/cuongquachc/Projects/nlp-test-toolkit/packages/server/src/utils/config.ts) - Environment-based configuration

**In Progress**:
- NLP Parser wrapper
- Database layer (SQLite)
- REST API endpoints
- Browser automation engine (Playwright)
- Test runner
- WebSocket for real-time updates

**Next Steps**:
- Complete NLP parser
- Implement database schema and migrations
- Build API routes
- Create test execution engine
- Set up WebSocket server

---

### Phase 2: Frontend (Planned)

**Status**: 📋 Planned

**Plan Created**: See [frontend_plan.md](file:///Users/cuongquachc/.gemini/antigravity/brain/fef2f1e9-0f57-4bfb-b589-956f12808765/frontend_plan.md)

**Key Components to Build**:
1. React application with Vite
2. Conversational ChatBox interface
3. Monaco-based test editor
4. Test suite management
5. Real-time execution viewer
6. Reports dashboard

**Technologies**:
- React 18 + TypeScript
- TailwindCSS for styling
- Monaco Editor for code editing
- React Query for server state
- WebSocket for real-time updates

**Next Phase**: Frontend implementation after backend completion

---

## Environment Configuration

### Required Environment Variables

\`\`\`bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_PATH=./data/llmtestkit.db

# LLM Providers
PRIMARY_LLM_PROVIDER=openai
FALLBACK_LLM_PROVIDERS=gemini,glm

# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4

# Google Gemini
GEMINI_API_KEY=xxx
GEMINI_MODEL=gemini-pro

# ChatGLM
GLM_API_KEY=xxx
GLM_MODEL=chatglm3-6b
GLM_ENDPOINT=https://open.bigmodel.cn/api/paas/v4

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_MODEL=anthropic/claude-3-opus

# AgentRouter
AGENTROUTER_API_KEY=xxx
AGENTROUTER_ENDPOINT=https://api.agentrouter.com/v1
\`\`\`

---

## Future Enhancements

1. **Phase 2**: Integration testing, visual regression testing
2. **Phase 3**: Unit test generation, security testing
3. **Phase 4**: CI/CD integration, cloud execution
4. **Phase 5**: Team collaboration, advanced analytics

---

## Document Version

- **Version**: 1.0.0
- **Last Updated**: 2025-12-06
- **Status**: Living document - updated after each implementation phase
