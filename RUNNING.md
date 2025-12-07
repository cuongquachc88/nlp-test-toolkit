# How to Run NLP Test Toolkit

## Quick Start

### 1. Configure Environment

First, create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add at least one LLM provider API key:

```bash
# Minimum required - choose one:
OPENAI_API_KEY=sk-your-key-here
# OR
GEMINI_API_KEY=your-key-here
# OR
GLM_API_KEY=your-key-here
```

### 2. Install Dependencies (if not already done)

```bash
pnpm install
```

### 3. Run Development Servers

**Option A: Run Both (Recommended)**

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd packages/server
pnpm dev
```

**Terminal 2 - Frontend:**
```bash
cd packages/web
pnpm dev
```

**Option B: Run from Root**

You can also run both concurrently from the root:

```bash
pnpm dev
```

This will start both servers in parallel.

---

## Access the Application

Once both servers are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

---

## Development Workflow

### Backend Development

```bash
cd packages/server

# Run in dev mode (with hot reload)
pnpm dev

# Build TypeScript
pnpm build

# Run production build
pnpm start
```

### Frontend Development

```bash
cd packages/web

# Run dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Troubleshooting

### Port Already in Use

If you get a port conflict:

**Backend (port 3000):**
```bash
# Change in .env
PORT=3001
```

**Frontend (port 5173):**
- Vite will automatically try the next available port
- Or edit `packages/web/vite.config.ts`

### TypeScript Build Errors

Currently there are some TypeScript strict mode errors. You can:

**Option 1: Run anyway (dev mode ignores some errors)**
```bash
pnpm dev
```

**Option 2: Disable strict mode temporarily**

Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

### Missing API Keys

If you see errors about missing API keys:
1. Check your `.env` file exists
2. Ensure at least one LLM provider is configured
3. Restart the server after editing `.env`

---

## What You'll See

### Frontend (http://localhost:5173)

- **Dashboard** - Stats and quick start
- **Test Suites** - List of saved tests
- **Create Test** - Chat interface to create tests
- **Reports** - Test execution results
- **Settings** - LLM provider configuration

### Backend (http://localhost:3000)

API endpoints:
- `GET /health` - Server health check
- `GET /api/status` - API status and available adapters

---

## Next Steps

1. **Configure LLM Provider** - Add your API key to `.env`
2. **Start Servers** - Run backend and frontend
3. **Open Browser** - Navigate to http://localhost:5173
4. **Create First Test** - Use the chat interface

---

## Production Build

To build for production:

```bash
# Build all packages
pnpm build

# Start production server
cd packages/server
pnpm start
```

Serve the frontend build from `packages/web/dist` using your preferred static file server.
