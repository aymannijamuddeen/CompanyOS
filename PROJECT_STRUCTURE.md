# 📁 CompanyOS Architecture & Project Structure

## Directory Overview

```
CompanyOS/
├── .github/
│   ├── workflows/
│   │   └── ci.yml                     # Continuous Integration workflow
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md              # GitHub issue template for bugs
│   │   └── feature_request.md         # GitHub issue template for features
│   └── pull_request_template.md       # Pull request guidelines template
│
├── .env.example                       # Root environment variable template
├── .gitignore                         # Git exclusion rules
├── CONTRIBUTING.md                    # Contributor guide
├── LICENSE                            # MIT License
├── package.json                       # Monorepo workspace configuration
├── package-lock.json                  # Lockfile
├── README.md                          # Main project documentation
├── QUICK_START.md                     # Rapid setup guide
├── PROJECT_STRUCTURE.md               # Codebase layout and module reference
├── INTELLIGENCE_LAYER.md              # Intelligence Layer architecture documentation
├── vite.config.ts                     # Root Vite configuration with reverse proxy
│
├── frontend/                          # Client-side React Application
│   ├── package.json                   # Frontend dependencies and scripts
│   ├── tsconfig.json                  # Frontend TypeScript configuration
│   ├── vite.config.ts                 # Frontend Vite configuration
│   ├── index.html                     # HTML root template
│   ├── .eslintrc.json                 # ESLint configuration
│   ├── public/                        # Static assets and fonts
│   └── src/
│       ├── main.tsx                   # React root entrypoint
│       ├── App.tsx                    # Route definitions and auth protection
│       ├── components/
│       │   ├── Header.tsx             # Main application header and navigation
│       │   └── admin/
│       │       └── AdminLayout.tsx    # Admin dashboard layout
│       ├── pages/
│       │   ├── Home.tsx               # Executive dashboard & Intelligence Q&A
│       │   ├── Agents.tsx             # Departmental AI agent directory & chat
│       │   ├── Tasks.tsx              # Task management board & assignment
│       │   ├── Knowledge.tsx          # Company documentation & search
│       │   ├── Company.tsx            # Company details & departments
│       │   ├── Settings.tsx           # Profile & organizational settings
│       │   ├── Login.tsx              # User login
│       │   ├── Register.tsx           # User registration & company onboarding
│       │   ├── Security.tsx           # Security settings (2FA, sessions)
│       │   ├── Support.tsx            # Support tickets & help
│       │   └── Account.tsx            # Account profile settings
│       ├── lib/
│       │   ├── api.ts                 # Typed API client for backend REST routes
│       │   ├── store.ts               # Zustand global state (auth, company)
│       │   ├── utils.ts               # Utility helpers & formatting
│       │   └── websocket.ts           # Real-time WebSocket connection manager
│       └── styles/
│           ├── design-tokens.css      # Core color surfaces, spacing, typography
│           └── global.css             # Component styling & typography rules
│
└── backend/                           # Server-side Express API
    ├── package.json                   # Backend dependencies and scripts
    ├── tsconfig.json                  # Backend TypeScript configuration
    ├── vitest.config.ts               # Test suite configuration
    ├── .env.example                   # Backend environment template
    ├── prisma/
    │   ├── schema.prisma              # Database schema definitions
    │   ├── seed.ts                    # Database seeder for default agents & depts
    │   └── migrations/
    │       └── 20260924090449_init/
    │           └── migration.sql      # Initial schema migration DDL
    ├── tests/
    │   ├── setup.ts                   # Test environment bootstrap
    │   └── companyos.test.ts          # Core integration tests
    └── src/
        ├── server.ts                  # HTTP & WebSocket server entrypoint
        ├── middleware/
        │   ├── auth.ts                # JWT authentication & session verification
        │   ├── rateLimit.ts           # Redis-backed sliding-window rate limiters
        │   └── errorHandler.ts        # Global error handling middleware
        ├── routes/
        │   ├── auth.ts                # Authentication endpoints
        │   ├── account.ts             # User account endpoints
        │   ├── company.ts             # Company & department management
        │   ├── agents.ts              # Agent directory & messaging
        │   ├── tasks.ts               # Task creation, assignment & tracking
        │   ├── knowledge.ts           # Document management & search
        │   ├── intelligence.ts        # Autonomous query answering & execution traces
        │   ├── notifications.ts       # Real-time notifications
        │   └── support.ts             # Support ticket handling
        └── services/
            ├── companyContext.ts      # Context builder for AI agents
            ├── companyDefaults.ts     # Pre-built agent & department schemas
            ├── password.ts            # Argon2id/bcrypt password hashing
            ├── prisma.ts              # Prisma client singleton
            ├── websocket.ts           # WebSocket connection & event dispatcher
            ├── knowledge/
            │   └── retrieval.ts       # Document search & evidence ranking
            └── intelligence/
                ├── orchestrator.ts    # Intent classifier & query dispatcher
                ├── provider.ts        # Model integration (OpenAI-compatible)
                ├── agentSynthesizer.ts# Deterministic synthesis fallback
                └── types.ts           # Type definitions for executions & tool calls
```
