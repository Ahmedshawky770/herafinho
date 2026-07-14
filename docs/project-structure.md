# Harfino Project Structure

> **Canonical reference**
> This document reflects the actual codebase layout. For the original aspirational
> design see `docs/plan.md`. For an outdated flat-structure sketch see `docs/structure.md` (deprecated).

```
herafino/
├── .claude/                     # Kilo/AI agent configuration
├── .devcontainer/               # Dev Container configuration
├── .github/                     # GitHub workflows + templates
├── .husky/                      # Git hooks
├── docs/                        # Comprehensive documentation
├── apps/
│   ├── web/                     # Next.js Fullstack App (RSC + API)
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router (RSC)
│   │   │   │   ├── (auth)/      # Auth route groups
│   │   │   │   │   └── login/
│   │   │   │   ├── (dashboard)/ # Authenticated pages (role-based)
│   │   │   │   │   ├── admin/
│   │   │   │   │   ├── client/
│   │   │   │   │   ├── craftsman/
│   │   │   │   │   ├── super_admin/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── api/         # API Route Handlers
│   │   │   │   │   ├── auth/
│   │   │   │   │   ├── admin/
│   │   │   │   │   ├── complaints/
│   │   │   │   │   ├── craftsmen/
│   │   │   │   │   ├── health/
│   │   │   │   │   ├── locations/
│   │   │   │   │   ├── notifications/
│   │   │   │   │   ├── orders/
│   │   │   │   │   ├── reviews/
│   │   │   │   │   ├── search/
│   │   │   │   │   ├── super-admin/
│   │   │   │   │   ├── upload/
│   │   │   │   │   └── webhooks/
│   │   │   │   ├── craftsmen/[id]/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── orders/new/
│   │   │   │   ├── search/
│   │   │   │   ├── unauthorized/
│   │   │   │   ├── layout.tsx   # Root layout (RTL, fonts, providers)
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── global-error.tsx
│   │   │   │   ├── not-found.tsx
│   │   │   │   ├── auth.ts      # NextAuth configuration export
│   │   │   │   └── page.tsx    # Landing page
│   │   │   ├── components/
│   │   │   │   ├── ui/           # Shadcn/UI primitives (~28 components)
│   │   │   │   ├── features/    # Presentational components
│   │   │   │   │   ├── layout/  # Sidebar, mobile-menu, top-bar
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   └── google-signin-button.tsx
│   │   │   │   │   ├── craftsman/   # (planned)
│   │   │   │   │   ├── orders/      # (planned)
│   │   │   │   │   ├── reviews/     # (planned)
│   │   │   │   │   ├── complaints/  # (planned)
│   │   │   │   │   ├── locations/   # (planned)
│   │   │   │   │   ├── admin/       # (planned)
│   │   │   │   │   └── search/      # (planned)
│   │   │   │   ├── providers/
│   │   │   │   │   ├── providers.tsx
│   │   │   │   │   ├── query-provider.tsx
│   │   │   │   │   ├── theme-provider.tsx
│   │   │   │   │   ├── toast-provider.tsx
│   │   │   │   │   └── auth-provider.tsx
│   │   │   │   └── landing-page.tsx
│   │   │   ├── middleware.ts      # Next.js auth middleware
│   │   │   ├── features/         # Domain Feature Modules (DDD-style)
│   │   │   │   ├── index.ts
│   │   │   │   ├── auth/         # (planned)
│   │   │   │   ├── complaint/    # (index + sub-routes)
│   │   │   │   ├── craftsman/    # (index + sub-routes)
│   │   │   │   ├── order/        # (index + sub-routes)
│   │   │   │   ├── reviews/      # (planned)
│   │   │   │   ├── locations/    # (planned)
│   │   │   │   ├── notifications/ # (planned)
│   │   │   │   └── admin/        # (planned)
│   │   │   ├── hooks/            # Shared custom hooks
│   │   │   │   └── index.ts
│   │   │   ├── lib/             # Foundation / Core Libraries
│   │   │   │   ├── auth/
│   │   │   │   │   ├── options.ts   # NextAuth configuration
│   │   │   │   │   ├── jwt.ts      # JWT utilities
│   │   │   │   │   └── middleware.ts # Auth middleware
│   │   │   │   ├── cache/
│   │   │   │   │   ├── cache-service.ts
│   │   │   │   │   ├── cache-event-handler.ts
│   │   │   │   │   ├── cache-invalidation.ts
│   │   │   │   │   ├── cache-keys.ts
│   │   │   │   │   ├── rate-limit.middleware.ts
│   │   │   │   │   ├── rate-limit.service.ts
│   │   │   │   │   └── repositories/
│   │   │   │   ├── config/
│   │   │   │   │   └── env.ts
│   │   │   │   ├── db/
│   │   │   │   │   ├── schema.ts    # Drizzle ORM Schema
│   │   │   │   │   ├── index.ts     # Database connection
│   │   │   │   │   ├── migrations/  # Drizzle auto-generated
│   │   │   │   │   ├── repositories/
│   │   │   │   │   └── seed.ts
│   │   │   │   ├── errors/
│   │   │   │   │   ├── app-error.ts
│   │   │   │   │   ├── not-found-error.ts
│   │   │   │   │   ├── conflict-error.ts
│   │   │   │   │   ├── unauthorized-error.ts
│   │   │   │   │   └── forbidden-error.ts
│   │   │   │   ├── events/
│   │   │   │   │   ├── valkey-event-bus.ts
│   │   │   │   │   ├── outbox-processor.ts
│   │   │   │   │   ├── outbox-repository.ts
│   │   │   │   │   ├── event-bus.ts
│   │   │   │   │   ├── webhook-dispatcher.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── http/
│   │   │   │   │   └── error-handler.ts
│   │   │   │   ├── logger/
│   │   │   │   │   └── factory.ts  # Pino logger factory
│   │   │   │   ├── storage/
│   │   │   │   │   ├── storage-service.ts
│   │   │   │   │   ├── local-storage.ts
│   │   │   │   │   ├── types.ts
│   │   │   │   │   ├── upload-helper.ts
│   │   │   │   │   └── validation.ts
│   │   │   │   ├── utils.ts
│   │   │   │   ├── validation/     # Zod schemas
│   │   │   │   │   ├── onboarding.schema.ts
│   │   │   │   │   ├── order.schema.ts
│   │   │   │   │   ├── complaint.schema.ts
│   │   │   │   │   ├── location.schema.ts
│   │   │   │   │   └── order.validation.ts
│   │   │   │   └── valkey/
│   │   │   │       ├── client.ts
│   │   │   │       └── index.ts
│   │   │   └── ws/
│   │   │       ├── index.ts        # WebSocket server startup
│   │   │       └── server.ts
│   │   ├── public/
│   │   ├── components.json
│   │   ├── drizzle.config.json
│   │   ├── eslint.config.mjs
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   ├── postcss.config.mjs
│   │   ├── sentry.client.config.ts
│   │   ├── sentry.server.config.ts
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   └── workers/                 # Background Workers (BullMQ)
│       ├── src/
│       │   ├── index.ts
│       │   ├── worker.ts
│       │   ├── processors/
│       │   │   ├── email.processor.ts
│       │   │   ├── notification-processor.ts
│       │   │   ├── order-processor.ts
│       │   │   ├── order-timeout.processor.ts
│       │   │   ├── webhook.processor.ts
│       │   │   └── index.ts
│       │   ├── services/
│       │   │   ├── notification-service.ts
│       │   │   └── audit-log-service.ts
│       │   ├── email/
│       │   │   └── resend-email-service.ts
│       │   └── event-handlers/
│       │       ├── index.ts
│       │       ├── craftsman.handlers.ts
│       │       ├── order.handlers.ts
│       │       ├── review.handler.ts
│       │       ├── complaint.handlers.ts
│       │       └── admin.handler.ts
│       └── package.json
├── packages/
│   ├── types/                    # Shared Types (SSOT)
│   │   ├── src/
│   │   │   ├── user.types.ts
│   │   │   ├── craftsman.types.ts
│   │   │   ├── order.types.ts
│   │   │   ├── review.types.ts
│   │   │   ├── complaint.types.ts
│   │   │   ├── location.types.ts
│   │   │   ├── notification.types.ts
│   │   │   ├── event.types.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── contracts/               # Interfaces (Contracts between modules)
│   │   ├── src/
│   │   │   ├── i-user-repository.ts
│   │   │   ├── i-craftsman-repository.ts
│   │   │   ├── i-order-repository.ts
│   │   │   ├── i-review-repository.ts
│   │   │   ├── i-complaint-repository.ts
│   │   │   ├── i-notification-service.ts
│   │   │   ├── i-email-service.ts
│   │   │   ├── i-location-service.ts
│   │   │   ├── i-cache-service.ts
│   │   │   ├── i-audit-service.ts
│   │   │   ├── i-websocket-service.ts
│   │   │   ├── i-webhook-dispatcher.ts
│   │   │   ├── i-event-bus.ts    # Event bus interface
│   │   │   ├── i-event-handler.ts # Event handler interface
│   │   │   ├── i-outbox-repository.ts # Outbox pattern repository
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                   # Shared implementations
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── cache/            # Cache strategies + invalidation
│           │   ├── cache-service.ts
│           │   ├── cache-event-handler.ts
│           │   ├── cache-invalidation.ts
│           │   └── cache-keys.ts
│           ├── db/               # Shared DB connection + schema
│           │   ├── schema.ts
│           │   └── index.ts
│           ├── events/           # Event Bus + Outbox pattern
│           │   ├── valkey-event-bus.ts
│           │   ├── outbox-processor.ts
│           │   └── outbox-repository.ts
│           ├── logger/
│           │   └── factory.ts    # Pino logger factory
│           ├── repositories/     # Generic repositories
│           │   ├── user.repository.ts
│           │   ├── craftsman.repository.ts
│           │   ├── order.repository.ts
│           │   ├── review.repository.ts
│           │   └── complaint.repository.ts
│           ├── services/         # Shared services
│           │   ├── email.service.ts
│           │   ├── notification.service.ts
│           │   ├── audit.service.ts
│           │   ├── location.service.ts
│           │   ├── webhook.service.ts
│           │   └── websocket.service.ts
│           └── valkey/
│               └── client.ts
├── tests/                        # Test Suite
│   ├── unit/
│   ├── integration/
│   ├── setup.ts
│   └── vitest.setup.ts
├── docker-compose.yml            # Development
├── docker-compose.prod.yml       # Production
├── Dockerfile                    # Next.js App (multi-stage)
├── Dockerfile.worker             # Background Worker
├── Dockerfile.postgres           # PostgreSQL init script
├── .env.example                  # Environment template
├── .env.test                     # Test environment
├── .eslintrc.js                  # ESLint config (fallback)
├── .prettierrc                   # Prettier config
├── .gitignore
├── .editorconfig                 # Editor consistency
├── tsconfig.json                 # Root TypeScript config
├── turbo.json                    # Turborepo config
├── package.json                  # Root monorepo package.json
├── package-lock.json
├── vite.config.ts                # Root Vitest/Vite aliases
├── vitest.config.ts
├── playwright.config.ts
├── LICENSE                        # MIT License (with Egyptian attribution)
├── README.md                     # Project README
└── PLAN.md                       # → docs/plan.md (symlink reference)
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **apps/web** | Single Next.js app (not separate frontend/backend) — easier deployment |
| **apps/workers** | Background jobs separated from web for independent scaling |
| **packages/types** | Single source of truth for domain types (SSOT) |
| **packages/contracts** | Interfaces between modules (Loose Coupling) |
| **packages/shared** | Shared services, event bus, cache, DB connection, repositories |
| **apps/web/src/features** | Feature slices (complaint, craftsman, order implemented; others planned) |
| **apps/web/src/lib** | Foundation layer (no business logic here) |
| **middleware.ts** | Next.js middleware inside the web app (`apps/web/src/middleware.ts`) |
| **docs/adr** | Architecture Decision Records (11 ADRs covering adopted + planned decisions) |
| **docs/diagrams** | C4 Model + Sequence + Data Flow diagrams |
| **docker-compose.prod.yml** | Production-grade compose (secrets, health checks) |
| **.github** | CI/CD pipelines |
| **.husky** | Git hooks for lint + format before commit |
| **Tailwind CSS v4** | Modern utility-first CSS with RTL & Arabic font support |
| **ESLint flat config** | Modern ESLint v9 with `eslint.config.mjs` in web app |
| **Vitest** | Fast unit & integration testing with jsdom environment |

---

## package.json Scripts (Root)

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:integration": "turbo run test:integration",
    "test:e2e": "turbo run test:e2e",
    "test:all": "turbo run test:unit && turbo run test:integration",
    "db:generate": "turbo run db:generate",
    "db:migrate": "turbo run db:migrate",
    "db:seed": "turbo run db:seed",
    "db:studio": "turbo run db:studio",
    "docker:dev": "docker compose up -d postgres valkey",
    "docker:down": "docker compose down",
    "worker": "turbo run worker",
    "worker:dev": "turbo run worker:dev",
    "ws": "turbo run ws",
    "ws:dev": "turbo run ws:dev"
  }
}
```

---

## apps/web package.json (Selected Scripts)

```json
{
  "scripts": {
    "dev": "next dev --turbo -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/lib/db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "ws": "tsx src/ws/index.ts",
    "ws:dev": "tsx --watch src/ws/index.ts"
  }
}
```

---

## apps/workers package.json

```json
{
  "scripts": {
    "worker": "tsx src/index.ts",
    "worker:dev": "tsx --watch src/index.ts"
  }
}
```

---

## docs/ Directory Structure

```
docs/
├── README.md
├── plan.md                       ← Main project plan (technical specification)
├── adr/
│   ├── README.md
│   ├── template.md
│   ├── 001_valkey_over_redis.md
│   ├── 002_why_modular_monolith.md
│   ├── 003_why_drizzle_orm.md
│   ├── 004_why_nextauth.md
│   ├── 005_websocket_vs_sse.md
│   ├── 006_react_query.md
│   ├── 007_postgresql_ssot.md
│   ├── 008_uuids_vs_autoincrement.md
│   ├── 009_bullmq.md
│   ├── 010_zod.md
│   └── 011_docker_strategy.md
├── troubleshooting/
│   ├── database_migration_failures.md
│   ├── valkey_connection_issues.md
│   ├── websocket_disconnections.md
│   ├── google_oauth_failures.md
│   ├── email_delivery_issues.md
│   └── react_query_stale_data.md
├── api-contracts/
│   └── openapi.yaml        # Hand-written API spec; canonical Zod types live in packages/types (duplicated *.types.ts removed)
├── diagrams/
```

---

## CI/CD Checklist

Every PR should pass:
- [ ] `npm run lint` (ESLint)
- [ ] `npm run typecheck` (TypeScript compiler)
- [ ] `npm run test:unit` (Vitest unit tests)
- [ ] `npm run test:integration` (Vitest + Supertest)
- [ ] `npm run db:generate` (migration didn't break)
- [ ] `npm run build` (Next.js build succeeds)
- [ ] Code review approved by at least 1 maintainer
- [ ] Diagrams updated if architecture changed
- [ ] ADR created for any architectural change

---

## Git Workflow

```
main (protected)
  ├── develop (merge target)
  │   ├── feature/craftsman-onboarding
  │   ├── feature/order-management
  │   ├── feature/real-time-location
  │   ├── bugfix/....
  │   └── chore/....
  └── hotfix/critical-fix
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>

Breaking Changes:
<breaking changes>
```

**Examples:**
```
feat(auth): add Google OAuth integration for craftsman onboarding
fix(orders): fix order status not updating after acceptance
docs(diagrams): update C4 model with WebSocket layer
refactor(cache): replace Redis with Valkey client
chore: bump Next.js to 14.2.0
```

---

## Related Documents
- [Plan](docs/plan.md)
- [ADR Template](docs/adr/template.md)
- [Testing Pyramid](docs/diagrams/testing-pyramid.md)
- [C4 L3 - Component](docs/diagrams/c4-l3-component-internal.md)
- [User Flows](docs/diagrams/user-flows.md)
