# Harfino (حرفينو)

A location-aware marketplace platform connecting Egyptian tradespeople (craftsmen) with clients seeking services.

## Overview

Harfino is a Next.js-based modular monolith platform that enables:

- Real-time location tracking of available craftsmen
- Craftsman verification workflow (ID, transport, workshop verification)
- Order management with status transitions
- Rating and review system
- Complaint handling with automated 3-strike ban policy
- Admin dashboard for moderation

**Stack**: Next.js 16 (App Router) + PostgreSQL + Valkey (Redis-compatible) + BullMQ + NextAuth v4 + React Query

## Prerequisites

| Requirement    | Version  |
| -------------- | -------- |
| Node.js        | 20.x LTS |
| Docker         | 24.x     |
| Docker Compose | v2.x     |

## Quick Start

```bash
# 1. Clone and install dependencies
git clone https://github.com/herafinho/platform.git
cd herafino
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Start infrastructure
npm run docker:dev
# Starts PostgreSQL and Valkey containers

# 4. Run database migrations
npm run db:generate
npm run db:migrate

# 5. Seed database (optional)
npm run db:seed

# 6. Start development servers
npm run dev        # Next.js app (http://localhost:3000)
npm run worker:dev # Background workers
```

## Documentation

- [Project Plan](docs/plan.md) - Complete technical specification and roadmap
- [Project Structure](docs/project-structure.md) - **Canonical** codebase organization
- [Architecture Decision Records](docs/adr/) - Architectural decisions and rationale
- [Architecture Diagrams](docs/diagrams/) - C4 model, ERD, sequence diagrams
- [Troubleshooting](docs/troubleshooting/) - Common issues and solutions

## Available Scripts

```bash
npm run dev                  # Start Next.js dev server
npm run build                # Production build
npm run start               # Start production server
npm run lint                # ESLint (turbo: runs in every package)
npm run typecheck           # TypeScript check (turbo: web, workers, shared, contracts, types)
npm run test                # Run all tests (vitest) across packages/apps
npm run test:watch          # Watch mode
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e            # E2E tests (Playwright — requires browsers installed)
npm run test:coverage       # Coverage report (text/json/html)
npm run db:generate         # Drizzle migrations
npm run db:migrate          # Apply migrations
npm run db:studio           # Database browser
npm run worker:dev          # Background workers (dev)
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Next.js Fullstack (App Router + Route Handlers)          │
├─────────────────────────────────────────────────────────┤
│  Modules: Auth, User, Craftsman, Order, Review, Complaint│
├─────────────────────────────────────────────────────────┤
│  PostgreSQL 16 (SSOT) + Valkey (Cache + Queue) + BullMQ  │
└─────────────────────────────────────────────────────────┘
```

## Deployment Topology

- **Web app** (`apps/web`): deployed to **Vercel** — Next.js 16 standalone build.
- **WebSocket server** (`apps/web/src/ws`, `npm run ws`): long-running service
  (not on Vercel) sharing `VALKEY_URL` for realtime pub/sub.
- **Background workers** (`apps/workers`, `npm run worker`): long-running BullMQ
  consumers (email, webhooks, outbox) — also run outside Vercel.

The site works on Vercel alone; real-time location and background jobs require
the separate WS/worker services. See `docs/runbook.md` for the full topology and
required environment variables.

## Contributing

Before submitting a PR, ensure:

- [ ] All tests pass (`npm run test:all`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] New code is covered by unit/integration tests (`npm run test:coverage` reports coverage; the threshold gate will be enforced as the suite grows)
- [ ] Relevant diagrams updated (if architectural changes)
- [ ] ADR created (for architectural decisions)

## License

MIT License with Egyptian attribution.
