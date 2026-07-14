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

| Requirement | Version |
|-------------|---------|
| Node.js | 20.x LTS |
| Docker | 24.x |
| Docker Compose | v2.x |

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
- Legacy docs: [Outdated structure sketch](docs/structure.md) (deprecated)

## Available Scripts

```bash
npm run dev                  # Start Next.js dev server
npm run build                # Production build
npm run start                # Start production server
npm run lint                 # ESLint + auto-fix
npm run typecheck            # TypeScript check
npm run test                 # Run all tests
npm run test:unit            # Unit tests (70%)
npm run test:integration     # Integration tests (20%)
npm run test:e2e             # E2E tests (10%)
npm run test:coverage        # Coverage report
npm run db:generate          # Drizzle migrations
npm run db:migrate           # Apply migrations
npm run db:studio            # Database browser
npm run worker:dev           # Background workers (dev)
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

## Contributing

Before submitting a PR, ensure:
- [ ] All tests pass (`npm run test:all`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Code coverage ≥ 80%
- [ ] Relevant diagrams updated (if architectural changes)
- [ ] ADR created (for architectural decisions)

## License

MIT License with Egyptian attribution.