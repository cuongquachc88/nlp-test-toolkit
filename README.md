# NLP Test Toolkit

> Natural language browser automation testing toolkit powered by LLMs and Playwright

## Overview

NLP Test Toolkit enables testers to create and execute browser automation tests using natural language, eliminating the need for coding expertise while maintaining professional-grade testing capabilities.

## Features

- 🤖 **Natural Language Interface** - Write tests in plain English
- 💬 **Conversational Test Creation** - Chat-based UI for intuitive test building
- 🔄 **Multi-LLM Support** - Flexible adapter system (OpenAI, Gemini, GLM, OpenRouter, AgentRouter)
- 🌐 **Cross-Browser Testing** - Powered by Playwright (Chrome, Firefox, Safari)
- 📦 **Version-Controlled Test Suites** - Save and reuse test scenarios (llmtestkit-1, llmtestkit-2, ...)
- 📊 **Detailed Reporting** - Screenshots, logs, and execution history

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nlp-test-toolkit

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env and add your API keys
```

### Configuration

Add your LLM provider API keys to `.env`:

```bash
# At minimum, configure one LLM provider
OPENAI_API_KEY=sk-xxx
# or
GEMINI_API_KEY=xxx
# or
GLM_API_KEY=xxx
```

### Development

```bash
# Start development servers (frontend + backend)
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## Project Structure

```
nlp-test-toolkit/
├── packages/
│   ├── web/          # React frontend
│   ├── server/       # Express backend
│   └── shared/       # Shared types
├── test-suites/      # Saved test suites
├── docs/             # Documentation
│   ├── AGENTS.md     # Agent instructions
│   └── tech-specs.md # Technical specifications
└── .env              # Environment configuration
```

## Usage

### Creating a Test via Chatbox

1. Open the application in your browser (http://localhost:5173)
2. Navigate to "Create Test"
3. Describe your test in natural language:
   ```
   I want to test the login form on https://myapp.com
   ```
4. The AI will generate test steps
5. Refine iteratively through conversation
6. Save as a versioned test suite

### Running Tests

1. Go to "Test Suites"
2. Select a saved suite (e.g., llmtestkit-1)
3. Click "Run Test"
4. View real-time execution progress
5. Check results, screenshots, and logs

## Documentation

- **[Technical Specifications](./docs/tech-specs.md)** - Complete project context
- **[Agent Instructions](./docs/AGENTS.md)** - Guidelines for AI agents
- **[Implementation Plan](./docs/implementation_plan.md)** - Development roadmap
- **[Adapter Architecture](./docs/adapter_architecture.md)** - LLM adapter design

## Technology Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Automation**: Playwright
- **Database**: SQLite
- **LLM Integration**: OpenAI, Google Gemini, ChatGLM, OpenRouter, AgentRouter

## Contributing

This project uses a monorepo structure with pnpm workspaces. Each package has its own README with specific contribution guidelines.

## License

MIT

## Support

For issues and questions, please refer to the [technical specifications](./docs/tech-specs.md) or create an issue in the repository.
