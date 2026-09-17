# Harfino — حرفينو

> Location-aware marketplace connecting Egyptian tradespeople with clients.

---

## What This Is

Harfino is a production-grade fullstack platform that lets clients discover nearby craftsmen, place service requests, and track orders in real time. It includes a complete admin moderation workflow, background email/webhook workers, and an event-driven architecture built for observability and scale.

This is not a tutorial project. It is a **multi-service system** designed to demonstrate production-ready engineering decisions: CI/CD, structured logging, error handling, database migrations, and deployment topology across Vercel and Render.

---

## Screenshots

> Add real screenshots to `docs/screenshots/` and replace the placeholders below.

| Screen | Preview |
|--------|---------|
| Landing / Search | ![Landing](docs/screenshots/01-landing.png) |
| Craftsman Profile | ![Profile](docs/screenshots/02-craftsman-profile.png) |
| Client Dashboard | ![Client Dashboard](docs/screenshots/03-client-dashboard.png) |
| Craftsman Dashboard | ![Craftsman Dashboard](docs/screenshots/04-craftsman-dashboard.png) |
| Admin Moderation | ![Admin](docs/screenshots/05-admin-moderation.png) |
| Order Flow | ![Order](docs/screenshots/06-order-flow.png) |

**How to capture screenshots:**
```bash
npm run dev
# Open http://localhost:3000 in your browser
# Use your OS screenshot tool and save into docs/screenshots/
```

---

## Technical Highlights

| Concern | Implementation |
|---------|---------------|
| **Frontend** | Next.js 16 (App Router) + React 19 + Tailwind CSS + Zustand + TanStack Query |
| **Backend** | Next.js Route Handlers + Server Actions |
| **Realtime** | Custom WebSocket server with Valkey pub/sub |
| **Background Jobs** | BullMQ workers for email, webhooks, and order timeouts |
| **Database** | PostgreSQL 16 with Drizzle ORM + PostGIS for geospatial queries |
| **Cache** | Valkey (Redis-compatible) for session, rate limiting, and pub/sub |
| **Auth** | NextAuth v5 with Google OAuth + JWT strategy + onboarding sync |
| **Storage** | S3-compatible presigned uploads |
| **Monitoring** | Sentry for error tracking + structured Pino logging |
| **Testing** | Vitest (unit + integration) + Playwright E2E |
| **CI/CD** | GitLab CI: lint → typecheck → unit → integration → security → e2e → build |
| **Deployment** | Vercel (web) + Render (WebSocket + worker) + Docker multi-stage |

---

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                           │
└───────────────────────────────┬───────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  Vercel      │  │  Render      │  │  Render      │
     │  Next.js 16  │  │  WS Server   │  │  Worker      │
     │  (web app)   │  │  :3001       │  │  (BullMQ)    │
     └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │ PostgreSQL   │ │   Valkey     │ │     S3       │
     │   (SSOT)     │ │  Cache/Queue │ │   Storage    │
     └──────────────┘ └──────────────┘ └──────────────┘
```

### Data Flow

```
Client creates order
        │
        ▼
API Route Handler (apps/web/src/app/api/orders/route.ts)
        │
        ▼
OrderRepository → INSERT into Postgres
        │
        ▼
OutboxRepository → INSERT event into event_outbox table
        │
        ▼
OutboxProcessor (polls every 1s)
        │
        ▼
ValkeyEventBus → publishes to events:order.created
        │
        ├─▶ EmailWorker → sends confirmation email via Resend
        ├─▶ NotificationService → in-app notification
        └─▶ WS Server → broadcasts to subscribed clients
```

---

## Project Structure

```
herafino/
├── apps/
│   ├── web/                    # Next.js 16 application
│   │   ├── src/
│   │   │   ├── app/            # App Router (pages + API routes)
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Auth, storage, cache, HTTP utilities
│   │   │   └── ws/             # WebSocket server
│   │   └── package.json
│   └── workers/                # BullMQ background workers
│       └── src/
│           ├── email/          # Resend email service
│           ├── event-handlers/ # Domain event handlers
│           └── services/       # Audit log service
├── packages/
│   ├── shared/                 # Business logic, DB, cache, jobs
│   │   └── src/
│   │       ├── db/             # Drizzle schema + migrations
│   │       ├── events/         # Outbox + Valkey event bus
│   │       ├── jobs/           # BullMQ queues + workers
│   │       ├── repositories/   # Data access layer
│   │       ├── services/       # Notification, websocket, moderation
│   │       └── valkey/         # Valkey client
│   ├── contracts/              # Repository + service interfaces
│   └── types/                  # Domain type definitions
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # DB-backed integration tests
│   └── e2e/                    # Playwright E2E tests
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   ├── diagrams/               # C4, ERD, sequence diagrams
│   └── api-contracts/          # OpenAPI spec
├── .gitlab-ci.yml              # CI/CD pipeline
├── docker-compose.yml          # Local development
├── Dockerfile                  # Production multi-stage build
├── render.yaml                 # Render deployment (WS + worker)
└── vercel.json                 # Vercel deployment config
```

---

## Domain Model

```
User
├── role: client | craftsman | admin | super_admin
├── onboardingComplete: boolean
└── └── CraftsmanProfile (1:1)
        ├── status: pending | approved | rejected | frozen | banned
        ├── craftType: carpenter | plumber | electrician | ...
        ├── transportType: bike | walking | car | minivan
        └── └── CraftsmanLocation (1:1)

Order
├── clientId → User
├── craftsmanId → User (nullable)
├── status: pending | accepted | rejected | in_progress | completed | cancelled
└── └── Review (1:1)
        ├── rating: 1-5
        └── comment: text

Complaint
├── reporterId → User
├── againstUserId → User
├── reason: no_show | bad_service | overpriced | harassment | fraud | other
├── status: pending | investigating | resolved | dismissed
└── actionTaken: warning | freeze | permanent_ban

Notification
├── userId → User
├── type: email | in_app | push
└── read: boolean

EventOutbox
├── eventName: string
├── payload: jsonb
├── status: pending | processing | completed | failed
└── retryCount: integer
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20.x LTS or 22.x |
| Docker | 24.x |
| Docker Compose | v2.x |
| npm | 10.x |

### Installation

```bash
# 1. Clone
git clone https://github.com/herafinho/platform.git
cd herafino

# 2. Install dependencies
npm install

# 3. Environment
cp .env.example .env.local
# Edit .env.local with your Google OAuth, database, and storage credentials

# 4. Start infrastructure
npm run docker:dev
# Starts: PostgreSQL 16 + Valkey

# 5. Database
npm run db:generate    # Generate migrations from schema
npm run db:migrate     # Apply migrations
npm run db:seed        # Optional: seed demo data

# 6. Run
npm run dev            # Next.js on http://localhost:3000
npm run worker:dev     # Background workers
npm run ws:dev         # WebSocket server on :3001
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | PostgreSQL direct connection (for migrations) |
| `VALKEY_URL` | Yes | Valkey/Redis connection string |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXTAUTH_SECRET` | Yes | NextAuth encryption secret |
| `NEXTAUTH_URL` | Yes | Public URL (e.g., `http://localhost:3000`) |
| `AWS_ACCESS_KEY_ID` | No | S3-compatible storage key |
| `AWS_SECRET_ACCESS_KEY` | No | S3-compatible storage secret |
| `AWS_REGION` | No | Storage region |
| `AWS_S3_BUCKET` | No | Storage bucket name |
| `AWS_CDN_URL` | No | CDN base URL for uploaded files |
| `RESEND_API_KEY` | No | Resend email service key |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `FIRST_USER_ADMIN` | No | Set to `true` to make first signup an admin |

See `.env.example` for the full list.

---

## Available Scripts

```bash
# Development
npm run dev                  # Next.js dev server (turbo)
npm run worker:dev           # Background workers
npm run ws:dev               # WebSocket server

# Production
npm run build                # Turbo build all packages
npm run start                 # Start Next.js production server

# Code Quality
npm run lint                 # ESLint across workspaces
npm run typecheck            # TypeScript across workspaces
npm run test                 # All tests
npm run test:unit            # Unit tests only
npm run test:integration     # DB-backed integration tests
npm run test:e2e             # Playwright E2E tests
npm run test:coverage        # Coverage report

# Database
npm run db:generate          # Generate migrations
npm run db:migrate           # Apply migrations
npm run db:studio            # Drizzle Studio GUI

# Infrastructure
npm run docker:dev           # Start Postgres + Valkey
npm run docker:down          # Stop containers
```

---

## Testing Strategy

| Layer | Tool | Scope | Location |
|-------|------|-------|----------|
| Unit | Vitest | Pure functions, services, repositories | `tests/unit/`, `packages/**/*.unit.test.ts` |
| Integration | Vitest + Postgres | DB-backed repository tests | `tests/integration/` |
| E2E | Playwright | Full browser flows | `tests/e2e/` |

**Running tests:**
```bash
npm run test:unit            # Fast, no DB required
RUN_INTEGRATION=1 npm run test:integration  # Requires Postgres
npm run test:e2e              # Requires browsers
```

---

## CI/CD Pipeline

The GitLab CI pipeline runs on merge requests and the default branch:

```
quality ──▶ test ──▶ security ──▶ e2e ──▶ build ──▶ db
   │          │          │         │       │       │
 lint      unit      npm       Play-   Turbo   drizzle
 typecheck  +      audit      wright   build   migrate
            integ  semgrep
                   gitleaks
```

**Pipeline triggers:**
- Merge request pipelines
- Default branch pushes
- Tags
- Manual triggers for DB migrations

See [`.gitlab-ci.yml`](.gitlab-ci.yml) for the full configuration.

---

## Deployment

### Web Application (Vercel)

The Next.js app deploys to Vercel as a standalone Docker build. See `vercel.json`.

**Required env vars on Vercel:**
- `DATABASE_URL`, `DIRECT_URL`, `VALKEY_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `AWS_*` vars for uploads
- `RESEND_API_KEY`, `SENTRY_DSN`

### WebSocket Server + Worker (Render)

Real-time location and background jobs require long-running services deployed on Render. See `render.yaml`.

**Services:**
- `herafino-ws` — WebSocket server on port 3001
- `herafino-worker` — BullMQ worker for email/webhooks/outbox

Both share the same `DATABASE_URL` and `VALKEY_URL` as the web app.

---

## Key Decisions

| Decision | Rationale | ADR |
|----------|-----------|-----|
| Valkey over Redis | Redis license change; Valkey is a drop-in replacement | [ADR 001](docs/adr/001_valkey_over_redis.md) |
| Modular monolith | Single deployable unit with clear module boundaries | [ADR 002](docs/adr/002_why_modular_monolith.md) |
| Drizzle ORM | Type-safe queries, migrations, relations | [ADR 003](docs/adr/003_why_drizzle_orm.md) |
| NextAuth v5 | OAuth + JWT with flexible callbacks | [ADR 004](docs/adr/004_why_nextauth.md) |
| Custom WS server | Real-time location + rooms + pub/sub | [ADR 005](docs/adr/005_websocket_vs_sse.md) |
| TanStack Query | Server state caching + deduplication | [ADR 006](docs/adr/006_react_query.md) |
| PostgreSQL SSOT | Single source of truth for all domain data | [ADR 007](docs/adr/007_postgresql_ssot.md) |
| UUIDs | Distributed-safe primary keys | [ADR 008](docs/adr/008_uuids_vs_autoincrement.md) |
| BullMQ | Reliable background job processing | [ADR 009](docs/adr/009_bullmq.md) |
| Zod | Runtime validation + TypeScript inference | [ADR 010](docs/adr/010_zod.md) |
| Docker multi-stage | Fast builds, minimal production images | [ADR 011](docs/adr/011_docker_strategy.md) |

---

## Contributing

Before submitting a PR:

- [ ] `npm run test:all` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] New code is covered by tests (`npm run test:coverage`)
- [ ] Relevant ADR created for architectural changes
- [ ] Diagrams updated if data model changed

---

## License

MIT License with Egyptian attribution.
