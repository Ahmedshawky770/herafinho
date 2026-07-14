# Harfino Project Structure (DEPRECATED)

> **Deprecated**: This document is outdated and does not reflect the current monorepo structure.
> The canonical reference is `docs/project-structure.md`. This file remains temporarily for
> historical context only and will be removed in a future cleanup.

> **Note**: This document describes an obsolete flat structure.

```
herafino/
├── .kilo/                       # Kilo project configuration
├── .devcontainer/               # Dev Container configuration
│   ├── devcontainer.json
│   └── Dockerfile
├── .github/                     # GitHub workflows + templates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── report_abuse.md
│   └── workflows/
│       ├── ci.yml              # Lint + Test + Build
│       ├── cd-preview.yml      # Deploy to Vercel (preview)
│       └── cd-prod.yml         # Deploy to VPS (production)
├── .husky/                      # Git hooks
│   ├── pre-commit
│   └── pre-push
├── app/                         # Next.js App Router (RSC + API)
│   ├── (auth)/                  # Auth route groups (if used)
│   ├── (dashboard)/             # Authenticated dashboard pages
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── client/
│   │   │   └── page.tsx
│   │   ├── craftsman/
│   │   │   ├── onboarding/
│   │   │   │   ├── page.tsx
│   │   │   │   └── form.tsx
│   │   │   ├── orders/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── status/
│   │   │       └── page.tsx
│   │   ├── super_admin/
│   │   │   └── page.tsx
│   │   ├── layout.tsx           # Shared dashboard layout
│   │   ├── loading.tsx          # Dashboard loading skeleton
│   │   └── error.tsx            # Dashboard error boundary
│   ├── api/                     # API Route Handlers
│   │   ├── auth/[...nextauth]/
│   │   ├── upload/
│   │   │   ├── presigned/route.ts
│   │   │   ├── complete/route.ts
│   │   │   ├── route.ts
│   │   │   ├── presigned-url/route.ts
│   │   │   ├── local-save/route.ts
│   │   │   └── multipart/route.ts
│   │   ├── craftsmen/route.ts
│   │   ├── orders/route.ts
│   │   ├── reviews/route.ts
│   │   ├── complaints/route.ts
│   │   ├── search/route.ts
│   │   └── health/route.ts
│   ├── globals.css              # Tailwind + @theme + global styles
│   ├── layout.tsx               # Root layout (RTL, fonts, providers)
│   ├── loading.tsx              # Root loading
│   ├── error.tsx                # Root error boundary
│   ├── not-found.tsx            # 404 page
│   ├── unauthorized/page.tsx    # 403 page
│   └── page.tsx                 # Landing page
├── components/                  # React Components
│   ├── ui/                      # Shadcn/UI primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   └── ... (24 shadcn primitives)
│   ├── features/                # Feature-specific components
│   │   ├── layout/              # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-menu.tsx
│   │   │   └── top-bar.tsx
│   │   ├── craftsman/           # Craftsman feature components
│   │   │   ├── onboarding-wizard.tsx
│   │   │   ├── craft-type-selector.tsx
│   │   │   ├── transport-uploader.tsx
│   │   │   ├── id-card-uploader.tsx
│   │   │   ├── availability-toggle.tsx
│   │   │   └── location-map.tsx
│   │   ├── orders/              # Order feature components
│   │   │   ├── create-order-modal.tsx
│   │   │   ├── order-card.tsx
│   │   │   └── order-timeline.tsx
│   │   ├── reviews/
│   │   │   ├── review-form.tsx
│   │   │   └── review-card.tsx
│   │   ├── complaints/
│   │   │   ├── complaint-form.tsx
│   │   │   └── complaint-timeline.tsx
│   │   ├── locations/           # Map components
│   │   │   ├── map-component.tsx
│   │   │   ├── nearby-craftsmen-list.tsx
│   │   │   └── craftsman-marker.tsx
│   │   ├── admin/               # Admin feature components
│   │   │   ├── review-queue.tsx
│   │   │   ├── moderation-form.tsx
│   │   │   ├── stats-cards.tsx
│   │   │   └── user-management-table.tsx
│   │   └── search/              # Search components
│   │       ├── craftsman-card.tsx
│   │       └── craftsman-search.tsx
│   └── providers/               # React context providers
│       ├── providers.tsx
│       └── ws-provider.tsx
├── lib/                         # Foundation / Core Libraries
│   ├── auth/
│   │   ├── options.ts           # NextAuth configuration
│   │   └── middleware.ts         # Auth middleware
│   ├── db/
│   │   ├── schema.ts            # Drizzle ORM schema
│   │   ├── index.ts             # Database connection
│   │   ├── repositories/         # Repository implementations
│   │   │   ├── user.repository.ts
│   │   │   ├── craftsman.repository.ts
│   │   │   ├── order.repository.ts
│   │   │   ├── review.repository.ts
│   │   │   └── complaint.repository.ts
│   │   ├── migrations/           # Drizzle auto-generated migrations
│   │   └── seed.ts
│   ├── events/                  # Event Bus + Outbox pattern
│   │   ├── valkey-event-bus.ts
│   │   ├── outbox-processor.ts
│   │   ├── outbox-repository.ts
│   │   └── event-store.ts
│   ├── cache/                   # Caching layer (Valkey)
│   │   ├── cache-event-handler.ts
│   │   ├── repositories/         # Cached repositories
│   │   │   └── cached-craftsman-repository.ts
│   │   └── cache.service.ts
│   ├── storage/                 # File storage (S3/local)
│   │   ├── storage-service.ts
│   │   └── types.ts
│   ├── logger/
│   │   └── factory.ts           # Pino logger factory
│   ├── errors/                  # Custom error classes
│   │   ├── app-error.ts
│   │   ├── not-found-error.ts
│   │   ├── conflict-error.ts
│   │   ├── unauthorized-error.ts
│   │   └── forbidden-error.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   └── formatters.ts
│   └── contracts/               # Interface contracts (re-exported from packages/contracts)
├── workers/                     # Background Workers
│   ├── worker.ts                # Main worker entry point
│   ├── processors/
│   │   ├── email.processor.ts
│   │   └── webhook.processor.ts
│   ├── email/
│   │   └── resend-email-service.ts
│   ├── services/
│   │   ├── notification-service.ts
│   │   └── audit-log-service.ts
│   └── event-handlers/
│       ├── craftsman.handlers.ts
│       ├── order.handlers.ts
│       ├── review.handler.ts
│       ├── complaint.handlers.ts
│       └── admin.handler.ts
├── ws/                          # WebSocket Server
│   └── index.ts                 # WS server (port 3001)
├── packages/                    # Shared packages (flat structure, not monorepo)
│   ├── types/
│   │   ├── src/
│   │   │   ├── user.types.ts
│   │   │   ├── craftsman.types.ts
│   │   │   ├── order.types.ts
│   │   │   ├── review.types.ts
│   │   │   ├── complaint.types.ts
│   │   │   ├── location.types.ts
│   │   │   ├── notification.types.ts
│   │   │   ├── api.types.ts
│   │   │   ├── pagination.types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   └── contracts/               # TypeScript interfaces
│       ├── src/
│       │   ├── i-user-repository.ts
│       │   ├── i-craftsman-repository.ts
│       │   ├── i-order-repository.ts
│       │   ├── i-review-repository.ts
│       │   ├── i-complaint-repository.ts
│       │   ├── i-notification-service.ts
│       │   ├── i-email-service.ts
│       │   ├── i-location-service.ts
│       │   ├── i-cache-service.ts
│       │   ├── i-audit-service.ts
│       │   ├── i-websocket-service.ts
│       │   └── i-webhook-dispatcher.ts
│       └── package.json
├── tests/                        # Test Suite
│   ├── unit/
│   │   ├── components/
│   │   │   └── craftsman-card.test.tsx
│   │   ├── repositories/
│   │   │   └── craftsman.repository.test.ts
│   │   ├── lib/
│   │   │   └── utils.test.ts
│   │   └── validation/
│   │       ├── location.schema.test.ts
│   │       └── search.schema.test.ts
│   └── integration/
│       ├── api/
│       │   ├── search.test.ts
│       │   └── health.test.ts
│       └── (e2e tests TBD)
├── docs/                         # Documentation
│   ├── adr/                      # Architecture Decision Records (11 files)
│   │   ├── template.md
│   │   ├── 001_valkey_over_redis.md
│   │   ├── 002_why_modular_monolith.md
│   │   ├── 003_why_drizzle_orm.md
│   │   ├── 004_why_nextauth.md
│   │   ├── 005_websocket_vs_sse.md
│   │   ├── 006_react_query.md
│   │   ├── 007_postgresql_ssot.md
│   │   ├── 008_uuids_vs_autoincrement.md
│   │   ├── 009_bullmq.md
│   │   ├── 010_zod.md
│   │   └── 011_docker_strategy.md
│   ├── diagrams/                 # C4 + Sequence + Data Flow diagrams
│   │   ├── index.md
│   │   ├── c4-l1-system-context.md
│   │   ├── c4-l2-container-deployment.md
│   │   ├── c4-l3-component-internal.md
│   │   ├── erd.md
│   │   ├── data-flow-onboarding.md
│   │   ├── data-flow-order.md
│   │   ├── data-flow-complaint.md
│   │   ├── seq-google-oauth.md
│   │   ├── seq-realtime-location.md
│   │   ├── caching-strategy.md
│   │   ├── webhook-architecture.md
│   │   ├── deployment-pipeline.md
│   │   ├── security-architecture.md
│   │   ├── monitoring-architecture.md
│   │   ├── testing-pyramid.md
│   │   └── user-flows.md         # ← Fixed: corrupted Mermaid syntax restored
│   ├── api-contracts/
│   │   └── openapi.yaml        # Canonical Zod types are in packages/types (duplicated *.types.ts removed)
│   ├── troubleshooting/
│   │   ├── database_migration_failures.md
│   │   ├── valkey_connection_issues.md
│   │   ├── websocket_disconnections.md
│   │   ├── google_oauth_failures.md
│   │   ├── email_delivery_issues.md
│   │   └── react_query_stale_data.md
│   ├── plan.md                   # Main project plan
│   └── README.md
├── public/                       # Static assets
│   ├── manifest.json             # ← Created: PWA manifest
│   ├── robots.txt                # ← Created: SEO robots
│   ├── icons/                    # (TODO: add icon-192x192.png, icon-512x512.png)
│   ├── images/
│   └── ...
├── hooks/                        # Git hooks scripts
├── middleware/                   # Custom middleware scripts
├── features/                     # Feature module stubs (flat structure)
├── docker-compose.yml            # Development
├── docker-compose.prod.yml       # Production
├── Dockerfile                    # Next.js multi-stage build
├── tailwind.config.ts            # Tailwind v4 config (theme + CSS vars)
├── postcss.config.mjs
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── vitest.config.ts
├── drizzle.config.json
├── .env.example                  # Environment template (updated)
├── .env.local                    # Local secrets (gitignored)
├── .env.test                     # Test environment
├── package.json                  # Root package.json
├── package-lock.json
├── tsconfig.tsbuildinfo
├── README.md
└── turbo.json                    # (if Turborepo is used)
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Flat structure** | Single Next.js app (not monorepo) — simpler deployment, fewer build steps |
| **app/ directory** | Next.js App Router (RSC + Server Actions + API Routes) |
| **workers/ directory** | Background jobs separated from web for independent scaling |
| **packages/types** | Single source of truth for types (SSOT) — shared between web and workers |
| **packages/contracts** | Interfaces between modules (Loose Coupling) |
| **components/features** | Feature-based organization (not tech-based) |
| **lib/** | Foundation layer (DB, events, auth, storage) — no business logic |
| **docs/adr** | Architecture Decision Records for every major choice |
| **docs/diagrams** | C4 Model + Sequence + Data Flow diagrams |

---

## package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "docker:dev": "docker compose up -d postgres valkey",
    "docker:prod": "docker compose -f docker-compose.prod.yml up -d",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx lib/db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "worker:dev": "tsx workers/worker.ts",
    "worker:prod": "node dist/workers/worker.js",
    "preview": "npm run build && npm run start"
  }
}
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
- [Plan](plan.md)
- [ADR Template](adr/template.md)
- [Testing Pyramid](diagrams/testing-pyramid.md)
- [C4 L3 - Component](diagrams/c4-l3-component-internal.md)
- [User Flows](diagrams/user-flows.md)
