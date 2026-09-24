# 🏢 CompanyOS — Autonomous Enterprise Intelligence & Multi-Agent Operations

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.18-000000.svg?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1.svg?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg?logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CompanyOS** is a security-hardened, multi-agent AI operating system designed for enterprise operational intelligence, departmental coordination, task orchestration, and institutional knowledge retrieval.

It empowers organizations to deploy coordinated AI specialists (CEO, Sales, Marketing, Finance, HR, Operations) backed by dynamic knowledge documents, real-time activity streams, and an intent routing engine with OpenAI-compatible LLM orchestration or deterministic local fallback.

---

## 🌟 Key Capabilities

### 🧠 Provider-Neutral Intelligence Layer
- **Orchestration Boundary**: Separates prompt orchestration, domain routing, and retrieval from model providers.
- **Intent Router**: Automatically classifies incoming organizational queries into domains (executive, sales, finance, operations, HR, marketing, knowledge).
- **Flexible Provider Support**: Seamlessly plugs into any OpenAI-compatible endpoint (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`), with zero-config deterministic fallback that synthesizes answers directly from company data and documents without hallucinations.
- **Full Execution Tracing**: Every intelligence invocation logs an `AgentExecution`, tool calls, evidence sources, and activities for complete auditability.

### 🤖 Multi-Agent Specialist Framework
- **Preconfigured Specialists**: Out-of-the-box autonomous agents tailored for enterprise domains:
  - 👑 **CEO Agent**: High-level cross-functional reasoning, strategic delegation, and executive oversight.
  - 💼 **Sales Agent**: Pipeline acceleration, deal stage analysis, customer insights, and conversion tracking.
  - 📢 **Marketing Agent**: Demand generation, campaign tracking, and brand growth analytics.
  - 📊 **Finance Agent**: Cash flow health, budgetary oversight, run rates, and fiscal risk tracking.
  - 👥 **HR Agent**: Team structure, headcount planning, talent acquisition, and employee policy queries.
  - ⚙️ **Operations Agent**: Bottleneck detection, execution velocity, process optimization, and task dispatching.
- **Persistent Conversations**: Interactive, thread-safe chat with individual agents and real-time streaming updates.

### 📚 Knowledge Base & Document Retrieval
- **Institutional Memory**: Upload and manage internal handbooks, strategy memos, process guides, and technical documentation.
- **Contextual Search**: High-performance semantic/text search across all company documents with source attribution.
- **Live Evidence Citations**: Agent answers cite exact underlying documentation cards for organizational transparency.

### 📋 Enterprise Tasks & Workflow Board
- **Task Management**: Create, assign, prioritize, and track tasks across departments.
- **Agent Assignment**: Tasks can be assigned directly to AI agents or human operators.
- **Priority & State Tracking**: Real-time status changes (`pending`, `in_progress`, `completed`, `blocked`).

### 🛡️ Enterprise Security & RBAC
- **Password Security**: Argon2id and bcrypt hashing with cryptographic salts.
- **Session Protection**: JWT authentication with refresh token rotation and session invalidation.
- **Rate Limiting**: Sliding-window rate limiting backed by Redis.
- **Defensive Headers**: Complete Helmet security configuration, CORS validation, and sanitized inputs.
- **Data Protection**: Parameterized SQL queries and migrations via Prisma ORM on PostgreSQL.

### 🎨 Precision Dark-Theme Design System
- **Strict Visual Design**: Built on dedicated tokens in `design-tokens.css` with surface hierarchy (`#0B0D10` → `#12151A` → `#1A1E24`).
- **Tabular Financial Typography**: JetBrains Mono for metrics and numbers, Space Grotesk for display, and Inter for copy.
- **Zero Template Slop**: Clean, flat, purpose-built interfaces with crisp contrast and no generic blur filters.

---

## 🏗️ Architecture

```
CompanyOS/
├── frontend/                     # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/           # Navigation, headers, layouts, shared UI
│   │   ├── pages/                # Home/Executive, Agents, Tasks, Knowledge, Company, Settings, Auth
│   │   ├── lib/                  # Zustand state stores, typed API client, WebSocket listener
│   │   └── styles/               # Strict design tokens & component CSS
│   └── public/                   # Fonts and static assets
│
├── backend/                      # Node.js + Express + TypeScript API Server
│   ├── src/
│   │   ├── middleware/           # Auth (JWT/Argon2id), rate limiting, error handling
│   │   ├── routes/               # Modular REST endpoints (auth, agents, tasks, knowledge, intelligence...)
│   │   └── services/             # Core business logic
│   │       ├── intelligence/     # Orchestrator, intent router, provider integration, execution tracers
│   │       ├── knowledge/        # Document retrieval & search service
│   │       ├── companyContext.ts # Context aggregation engine
│   │       ├── companyDefaults.ts# Initial seed generation for agents & departments
│   │       └── websocket.ts      # Real-time event broadcasting
│   ├── prisma/                   # PostgreSQL schema definition, migrations, and seed script
│   └── tests/                    # Vitest integration test suite
│
├── .github/                      # CI workflows, issue & PR templates
├── .env.example                  # Root environment template
└── package.json                  # Workspace monorepo root
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **npm**: v9.x or v10.x+
- **PostgreSQL**: v14+ (Local or Docker)
- **Redis**: v6+ (Local or Docker)

### 1. Clone the Repository
```bash
git clone https://github.com/aymannijamuddeen/CompanyOS.git
cd CompanyOS
```

### 2. Install Monorepo Dependencies
```bash
npm install
```

### 3. Spin Up Infrastructure (PostgreSQL & Redis via Docker)
If you do not already have local PostgreSQL and Redis instances running:

```bash
# Start PostgreSQL container
docker run -d --name companyos-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=companyos \
  -p 5432:5432 postgres:15-alpine

# Start Redis container
docker run -d --name companyos-redis \
  -p 6379:6379 redis:7-alpine
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
# Also copy to backend if running standalone
cp .env.example backend/.env
```

Review the values in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/companyos?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secure-jwt-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"
PORT=4000
FRONTEND_URL="http://localhost:3000"

# Optional: Add OpenAI API key for generative synthesis
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY=""
LLM_MODEL="gpt-4o-mini"
```

### 5. Run Database Migrations & Seed Default Agents
```bash
cd backend
npx prisma migrate dev --name init
npm run seed
cd ..
```

*Note: The seed script populates your company with the default departments (Executive, Sales, Marketing, Finance, HR, Operations), standard agents, and sample documentation.*

### 6. Start the Development Servers
From the root directory, run:
```bash
npm run dev
```

This starts:
- 💻 **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- 🔌 **Backend REST API**: [http://localhost:4000/api](http://localhost:4000/api)
- ⚡ **WebSocket Gateway**: `ws://localhost:4000/ws`
- 🩺 **Health Check**: [http://localhost:4000/health](http://localhost:4000/health)

---

## 📡 API Reference Overview

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Register a new user and initialize their company | No |
| `/api/auth/login` | `POST` | Authenticate user, returns JWT and refresh token | No |
| `/api/auth/refresh` | `POST` | Refresh access token using active refresh token | No |
| `/api/account/me` | `GET` | Get authenticated user profile and memberships | Yes |
| `/api/company` | `GET` | Retrieve active company details and departments | Yes |
| `/api/agents` | `GET` | List all available departmental agents | Yes |
| `/api/agents/:id/conversations` | `GET` | Get conversation history with specific agent | Yes |
| `/api/agents/:id/message` | `POST` | Send message to agent and receive response | Yes |
| `/api/tasks` | `GET`/`POST` | List company tasks or create a new task | Yes |
| `/api/tasks/:id` | `PATCH` | Update task status, assignee, or priority | Yes |
| `/api/knowledge` | `GET`/`POST` | Query knowledge documents or create new doc | Yes |
| `/api/intelligence/ask` | `POST` | Ask any company question to the Intelligence Layer | Yes |
| `/api/intelligence/executions` | `GET` | View recent execution logs, traces, and tool calls | Yes |
| `/api/notifications` | `GET` | Retrieve real-time notifications and alerts | Yes |

---

## 🧠 Intelligence Layer & LLM Configuration

The Intelligence Layer can run in two modes:

1. **Deterministic Local Mode (Default)**:
   - When `LLM_API_KEY` is omitted, CompanyOS queries PostgreSQL for relevant company context, departments, tasks, and knowledge base documents.
   - It synthesizes structured, factual answers with zero hallucination risk, providing exact document citations and actionable links.

2. **Generative LLM Mode**:
   - Provide an API key for any OpenAI-compatible provider (OpenAI, Groq, Ollama, vLLM, Together AI):
   ```env
   LLM_BASE_URL="https://api.openai.com/v1"
   LLM_API_KEY="sk-..."
   LLM_MODEL="gpt-4o-mini"
   ```
   - CompanyOS grounds the model with real-time company state, documents, and agent personas to provide strategic reasoning.

---

## 🧪 Testing & Verification

The codebase includes an automated test suite verifying password security, organization bootstrapping, department & agent provisioning, and intelligence execution flows.

```bash
# Run linting across workspaces
npm run lint

# Build frontend and backend TypeScript
npm run build

# Run Vitest test suite
npm test
```

---

## 🛠️ Monorepo Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Concurrently runs both frontend Vite server and backend TSX watcher |
| `npm run dev:frontend` | Runs frontend Vite development server |
| `npm run dev:backend` | Runs backend TSX live reloader |
| `npm run build` | Compiles frontend assets and backend TypeScript to `/dist` |
| `npm run lint` | Runs ESLint with zero-warning threshold |
| `npm test` | Executes backend Vitest suite |

---

## 🤝 Contributing

We welcome contributions of all kinds! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for details on our workflow, coding standards, and how to submit pull requests.

---

## 🔒 Security

For security vulnerability disclosures, please review [SECURITY.md](SECURITY.md) and report issues responsibly to [ayman.nijamuddeen@gmail.com](mailto:ayman.nijamuddeen@gmail.com).

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
