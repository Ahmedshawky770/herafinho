# Harfino Project Structure

```
herafino/
├── .claude/                     # Kilo/AI agent configuration
│   └── settings.local.json
├── .kilo/                       # Kilo project specific
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
├── docs/                        # Documentation
│   ├── adr/                     # Architecture Decision Records
│   │   ├── template.md
│   │   ├── 001_valkey_over_redis.md
│   │   ├── 002_modular_monolith.md
│   │   ├── 003_drizzle_orm.md
│   │   ├── 004_nextauth.md
│   │   ├── 005_websocket_vs_sse.md
│   │   ├── 006_react_query.md
│   │   ├── 007_postgresql_ssot.md
│   │   ├── 008_uuids_vs_autoincrement.md
│   │   ├── 009_bullmq.md
│   │   ├── 010_zod.md
│   │   └── 011_docker_strategy.md
│   ├── troubleshooting/
│   │   ├── database_migration_failures.md
│   │   ├── valkey_connection_issues.md
│   │   ├── websocket_disconnections.md
│   │   ├── google_oauth_failures.md
│   │   ├── email_delivery_issues.md
│   │   └── react_query_stale_data.md
│   ├── api-contracts/           # OpenAPI + TypeScript types
│   │   ├── openapi.yaml
│   │   ├── auth.types.ts
│   │   ├── craftsman.types.ts
│   │   └── order.types.ts
│   ├── diagrams/                # Diagrams (this layer)
│   │   ├── index.md             # ← You are here
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
│   │   └── user-flows.md
│   └── plan.md                  # Main project plan (design document)
├── apps/
│   ├── web/                     # Next.js Fullstack App (RSC + API)
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router (RSC)
│   │   │   │   ├── (auth)/      # Auth pages groups
│   │   │   │   │   ├── login/
│   │   │   │   │   └── onboarding/
│   │   │   │   ├── (dashboard)/ # Authenticated pages
│   │   │   │   │   ├── client/
│   │   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── craftsmen/
│   │   │   │   │   │   └── reviews/
│   │   │   │   │   ├── craftsman/
│   │   │   │   │   │   ├── onboarding/
│   │   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── profile/
│   │   │   │   │   │   └── status/
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   ├── craftsmen/
│   │   │   │   │   │   ├── complaints/
│   │   │   │   │   │   └── users/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/           # Shadcn/UI Components
│   │   │   │   │   ├── button.tsx
│   │   │   │   │   ├── input.tsx
│   │   │   │   │   ├── dialog.tsx
│   │   │   │   │   ├── card.tsx
│   │   │   │   │   ├── select.tsx
│   │   │   │   │   ├── toast.tsx
│   │   │   │   │   └── sonner.tsx
│   │   │   │   ├── layout/      # Layout (Sidebar, Navbar, MobileMenu)
│   │   │   │   │   ├── sidebar.tsx
│   │   │   │   │   ├── navbar.tsx
│   │   │   │   │   ├── mobile-menu.tsx
│   │   │   │   │   ├── footer.tsx
│   │   │   │   │   └── rtl-wrapper.tsx
│   │   │   │   ├── features/    # Feature-specific Components
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── google-signin-button.tsx
│   │   │   │   │   │   └── auth-guard.tsx
│   │   │   │   │   ├── craftsman/
│   │   │   │   │   │   ├── onboarding-wizard.tsx
│   │   │   │   │   │   ├── craft-type-selector.tsx
│   │   │   │   │   │   ├── transport-uploader.tsx
│   │   │   │   │   │   ├── id-card-uploader.tsx
│   │   │   │   │   │   ├── availability-toggle.tsx
│   │   │   │   │   │   └── location-map.tsx
│   │   │   │   │   ├── orders/
│   │   │   │   │   │   ├── create-order-modal.tsx
│   │   │   │   │   │   ├── order-card.tsx
│   │   │   │   │   │   ├── active-order-map.tsx
│   │   │   │   │   │   └── order-timeline.tsx
│   │   │   │   │   ├── reviews/
│   │   │   │   │   │   ├── review-form.tsx
│   │   │   │   │   │   └── review-card.tsx
│   │   │   │   │   ├── complaints/
│   │   │   │   │   │   ├── complaint-form.tsx
│   │   │   │   │   │   └── complaint-timeline.tsx
│   │   │   │   │   ├── locations/
│   │   │   │   │   │   ├── map-component.tsx
│   │   │   │   │   │   ├── nearby-craftsmen-list.tsx
│   │   │   │   │   │   └── craftsman-marker.tsx
│   │   │   │   │   ├── admin/
│   │   │   │   │   │   ├── review-queue.tsx
│   │   │   │   │   │   ├── moderation-form.tsx
│   │   │   │   │   │   ├── stats-cards.tsx
│   │   │   │   │   │   └── user-management-table.tsx
│   │   │   │   │   └── notifications/
│   │   │   │   │       ├── notification-queue.tsx
│   │   │   │   │       └── notification-item.tsx
│   │   │   │   └── providers/
│   │   │   │       ├── query-provider.tsx  # React Query
│   │   │   │       ├── auth-provider.tsx   # NextAuth Session
│   │   │   │       ├── theme-provider.tsx  # Dark mode
│   │   │   │       ├── toast-provider.tsx  # Toast notifications
│   │   │   │       └── ws-provider.tsx     # WebSocket Context
│   │   │   ├── features/         # Feature Modules (DDD-ish)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-auth.ts
│   │   │   │   │   │   ├── use-current-user.ts
│   │   │   │   │   │   └── use-oauth-signin.ts
│   │   │   │   │   ├── schemas/
│   │   │   │   │   │   └── auth.schema.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── auth.service.ts
│   │   │   │   │   ├── actions/
│   │   │   │   │   │   ├── sign-in.ts
│   │   │   │   │   │   ├── sign-out.ts
│   │   │   │   │   │   └── refresh-session.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── auth.types.ts
│   │   │   │   ├── craftsman/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-craftsman-profile.ts
│   │   │   │   │   │   ├── use-craftsman-orders.ts
│   │   │   │   │   │   ├── use-craftsman-location.ts
│   │   │   │   │   │   └── use-craftsman-cards.ts
│   │   │   │   │   ├── schemas/
│   │   │   │   │   │   └── craftsman.schema.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── craftsman.service.ts
│   │   │   │   │   │   └── upload.service.ts
│   │   │   │   │   ├── actions/
│   │   │   │   │   │   ├── submit-profile.ts
│   │   │   │   │   │   ├── toggle-availability.ts
│   │   │   │   │   │   └── upload-documents.ts
│   │   │   │   │   └── types/
│   │   │   │   │       ├── craftsman.types.ts
│   │   │   │   │       └── onboarding.types.ts
│   │   │   │   ├── orders/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-orders.ts
│   │   │   │   │   │   ├── use-active-order.ts
│   │   │   │   │   │   └── use-create-order.ts
│   │   │   │   │   ├── schemas/
│   │   │   │   │   │   └── order.schema.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── order.service.ts
│   │   │   │   │   ├── actions/
│   │   │   │   │   │   ├── create-order.ts
│   │   │   │   │   │   ├── accept-order.ts
│   │   │   │   │   │   ├── reject-order.ts
│   │   │   │   │   │   └── complete-order.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── order.types.ts
│   │   │   │   ├── reviews/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── use-reviews.ts
│   │   │   │   │   ├── actions/
│   │   │   │   │   │   └── submit-review.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── review.types.ts
│   │   │   │   ├── complaints/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── use-complaints.ts
│   │   │   │   │   ├── actions/
│   │   │   │   │   │   └── file-complaint.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── complaint.types.ts
│   │   │   │   ├── locations/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── use-location.ts
│   │   │   │   │   │   ├── use-nearby-craftsmen.ts
│   │   │   │   │   │   └── use-craftsman-position.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── geolocation.service.ts
│   │   │   │   │   │   └── maps.service.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── location.types.ts
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── use-notifications.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── notification.service.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── notification.types.ts
│   │   │   │   └── admin/
│   │   │   │       ├── hooks/
│   │   │   │       │   ├── use-admin-stats.ts
│   │   │   │       │   ├── use-admin-craftsmen.ts
│   │   │   │       │   └── use-admin-complaints.ts
│   │   │   │       └── types/
│   │   │   │           └── admin.types.ts
│   │   │   ├── lib/                 # Library / Foundation
│   │   │   │   ├── auth/
│   │   │   │   │   ├── options.ts         # NextAuth configuration
│   │   │   │   │   ├── middleware.ts       # Server-side auth middleware
│   │   │   │   │   └── jwt.ts            # JWT utilities
│   │   │   │   ├── db/
│   │   │   │   │   ├── schema.ts          # Drizzle ORM Schema
│   │   │   │   │   ├── index.ts           # Database connection
│   │   │   │   │   ├── migrations/        # Drizzle auto-generated
│   │   │   │   │   └── seed.rs          # Seed data (Arabic tady)
│   │   │   │   ├── valkey/
│   │   │   │   │   ├── client.ts          # Valkey connection
│   │   │   │   │   ├── cache.service.ts   # Cache abstraction
│   │   │   │   │   ├── rate-limiter.ts    # Rate limiting
│   │   │   │   │   └── distributed-lock.ts # SETNX locks
│   │   │   │   ├── logger/
│   │   │   │   │   ├── factory.ts         # Pino factory
│   │   │   │   │   └── index.ts
│   │   │   │   ├── errors/
│   │   │   │   │   ├── app-error.ts
│   │   │   │   │   ├── not-found-error.ts
│   │   │   │   │   ├── conflict-error.ts
│   │   │   │   │   ├── unauthorized-error.ts
│   │   │   │   │   └── forbidden-error.ts
│   │   │   │   ├── types/
│   │   │   │   │   ├── index.ts          # Unified types export
│   │   │   │   │   ├── user.types.ts
│   │   │   │   │   ├── craftsman.types.ts
│   │   │   │   │   ├── order.types.ts
│   │   │   │   │   ├── review.types.ts
│   │   │   │   │   ├── complaint.types.ts
│   │   │   │   │   ├── location.types.ts
│   │   │   │   │   ├── notification.types.ts
│   │   │   │   │   ├── api.types.ts
│   │   │   │   │   ├── pagination.types.ts
│   │   │   │   │   └── validation.types.ts
│   │   │   │   ├── contracts/       # Interfaces between modules
│   │   │   │   │   ├── i-user-repository.ts
│   │   │   │   │   ├── i-craftsman-repository.ts
│   │   │   │   │   ├── i-order-repository.ts
│   │   │   │   │   ├── i-review-repository.ts
│   │   │   │   │   ├── i-complaint-repository.ts
│   │   │   │   │   ├── i-notification-service.ts
│   │   │   │   │   ├── i-email-service.ts
│   │   │   │   │   ├── i-location-service.ts
│   │   │   │   │   ├── i-cache-service.ts
│   │   │   │   │   ├── i-audit-service.ts
│   │   │   │   │   ├── i-websocket-service.ts
│   │   │   │   │   └── i-webhook-dispatcher.ts
│   │   │   │   └── utils/
│   │   │   │       ├── constants.ts   # Constants (craft types, etc.)
│   │   │   │       ├── helpers.ts
│   │   │   │       ├── formatters.ts
│   │   │   │       ├── validators.ts
│   │   │   │       ├── parsers/       # JSON, URL parsers
│   │   │   │       ├── errors/        # Error utilities
│   │   │   │       ├── dates/         # Date formatting (Arabic)
│   │   │   │       ├── encryption/    # Encrypt/decrypt utilities
│   │   │   │       └── fetch/         # Fetch with retries
│   │   │   └── styles/
│   │   │       ├── globals.css        # Tailwind + @layer utilities
│   │   │       ├── rtl.css
│   │   │       ├── fonts.css          # Cairo + Tajawal fonts
│   │   │       └── animations.css
│   │   ├── public/                   # Static assets
│   │   │   ├── favicon.ico
│   │   │   ├── icons/                 # PWA icons (512x512)
│   │   │   │   ├── icon-192x192.png
│   │   │   │   ├── icon-512x512.png
│   │   │   │   └── apple-touch-icon.png
│   │   │   ├── images/
│   │   │   │   ├── placeholder.png
│   │   │   │   └── og-image.png
│   │   │   ├── manifest.json          # PWA manifest
│   │   │   └── robots.txt
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   ├── eslint.config.js
│   │   ├── prettier.config.js
│   │   └── package.json
│   └── workers/                 # Background Workers (Celery-style BullMQ)
│       ├── src/
│       │   ├── jobs/             # Background job tasks
│       │   │   ├── send-welcome-email.ts
│       │   │   ├── send-rejection-email.ts
│       │   │   ├── send-notification-email.ts
│       │   │   ├── send-order-notification.ts
│       │   │   ├── process-complaint.ts
│       │   │   ├── process-webhook-retry.ts
│       │   │   ├── cleanup-old-data.ts
│       │   │   ├── generate-reports.ts
│       │   │   └── index.ts
│       │   ├── queues/            # Queue processors
│       │   │   ├── email.queue.ts
│       │   │   ├── notification.queue.ts
│       │   │   ├── webhook.queue.ts
│       │   │   └── analytics.queue.ts
│       │   ├── services/
│       │   │   ├── email.worker.service.ts
│       │   │   ├── notification.worker.service.ts
│       │   │   ├── webhook.worker.service.ts
│       │   │   └── scheduler.worker.service.ts
│       │   └── index.ts           # Worker entry point
│       └── package.json
├── packages/
│   ├── types/                   # Shared Types (SSOT)
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
│   │   │   ├── validation.types.ts
│   │   │   ├── job.types.ts
│   │   │   └── index.ts
│   │   └── package.json
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
│   │   │   ├── i-audit-service.ts
│   │   │   ├── i-cache-service.ts
│   │   │   ├── i-websocket-service.ts
│   │   │   └── i-webhook-dispatcher.ts
│   │   └── package.json
│   └── config/                  # Shared Configuration
│       ├── src/
│       │   ├── env.ts           # Env validation (zod)
│       │   ├── valkey.ts        # Valkey client config
│       │   ├── logger.ts        # Logger factory config
│       │   ├── drizzle.ts        # Drizzle config
│       │   └── index.ts
│       └── package.json
├── docker-compose.yml            # Development
├── docker-compose.prod.yml       # Production
├── Dockerfile                    # Next.js App (multi-stage)
├── Dockerfile.worker             # Background Worker
├── Dockerfile.postgres           # PostgreSQL init script
├── redis-config.conf             # Valkey configuration
├── .env.example                  # Environment template
├── .env.local                    # Local secrets (gitignored)
├── .env.test                     # Test environment
├── .eslintrc.js                  # ESLint config
├── .prettierrc                   # Prettier config
├── .gitignore
├── .editorconfig                 # Editor consistency
├── tsconfig.json                 # Root TypeScript config
├── package.json                  # Root monorepo package.json
├── turbo.json                    # Turborepo config (if used)
├── LICENSE                        # MIT License (with Egyptian attribution)
├── README.md                     # Project README
└── PLAN.md                       # → docs/plan.md (project plan)
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **apps/web** | Single Next.js app (not separate frontend/backend) — easier deployment |
| **apps/workers** | Background jobs separated from web for scaling |
| **packages/types** | Single source of truth for types (SSOT) |
| **packages/contracts** | Interfaces between modules (Loose Coupling) |
| **apps/web/src/features** | Feature-based organization (not tech-based) |
| **apps/web/src/lib** | Foundation layer (no business logic here) |
| **docs/adr** | Architecture Decision Records for every major choice |
| **docs/diagrams** | C4 Model + Sequence + Data Flow |
| **docker-compose.prod.yml** | Production-grade compose (secrets, health checks) |
| **.github** | CI/CD pipelines |
| **.husky** | Git hooks for lint + format before commit |

---

## package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbo",
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
    "db:seed": "tsx apps/web/src/lib/db/seed.ts",
    "db:studio": "drizzle-kit studio",
    "worker:dev": "tsx apps/workers/src/index.ts",
    "worker:prod": "node dist/workers/index.js",
    "preview": "npm run build && npm run start",
    "adr:new": "npx adr-tools new"
  }
}
```

---

## Turborepo Monorepo (Alternative)

```
herafino/
├── package.json           # Root
├── turbo.json
├── apps/
│   ├── web/
│   └── workers/
├── packages/
│   ├── types/
│   ├── contracts/
│   ├── config/
│   └── ui/                # Shared UI components (Shadcn/UI lib)
├── tools/
│   ├── eslint-plugin/     # Custom ESLint rules
│   └── ci/
└── docker-compose.yml
```

---

## Shared UI Components (Optional)

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── map.tsx          # Google Maps wrapper
│   │   │   ├── location-picker.tsx
│   │   │   └── rating-stars.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── navbar.tsx
│   │   │   └── rtl-provider.tsx
│   │   └── features/
│   │       ├── craftsman-card.tsx
│   │       └── order-timeline.tsx
│   └── lib/
│       ├── utils.ts
│       └── hooks/
│           └── use-geolocation.ts
├── package.json
└── README.md
```

---

## docs/ Directory Structure

```
docs/
├── README.md                     # Documentation index
├── plan.md                       # ← Main project plan (you are here)
├── adr/
│   ├── README.md                 # ADR index
│   ├── 001_valkey_over_redis.md
│   ├── 002_modular_monolith.md
│   ├── 003_drizzle_orm.md
│   ├── 004_nextauth.md
│   ├── 005_websocket_vs_sse.md
│   ├── 006_react_query.md
│   ├── 007_postgresql_ssot.md
│   ├── 008_uuids_vs_autoincrement.md
│   ├── 009_bullmq.md
│   ├── 010_zod.md
│   ├── 011_docker_strategy.md
│   └── template.md
├── troubleshooting/
│   ├── database_migration_failures.md
│   ├── valkey_connection_issues.md
│   ├── websocket_disconnections.md
│   ├── google_oauth_failures.md
│   ├── email_delivery_issues.md
│   └── react_query_stale_data.md
├── api-contracts/
│   ├── openapi.yaml
│   ├── auth.types.ts
│   ├── craftsman.types.ts
│   ├── order.types.ts
│   ├── review.types.ts
│   └── complaint.types.ts
├── diagrams/
│   ├── index.md
│   ├── c4-l1-system-context.md
│   ├── c4-l2-container-deployment.md
│   ├── c4-l3-component-internal.md
│   ├── erd.md
│   ├── data-flow-onboarding.md
│   ├── data-flow-order.md
│   ├── data-flow-complaint.md
│   ├── seq-google-oauth.md
│   ├── seq-realtime-location.md
│   ├── caching-strategy.md
│   ├── webhook-architecture.md
│   ├── deployment-pipeline.md
│   ├── security-architecture.md
│   ├── monitoring-architecture.md
│   ├── testing-pyramid.md
│   └── user-flows.md
├── api-design/
│   ├── rest-api.md
│   ├── websocket-api.md
│   └── errors.md
└── runbooks/
    ├── incident-response.md
    ├── deployment.md
    └── rollback.md
```

---

## Shared Libraries (Optional Extras)

| Library | Path | Purpose |
|---------|------|---------|
| **@herafino/ui** | `packages/ui/` | Shared React components |
| **@herafino/types** | `packages/types/` | Shared TypeScript types |
| **@herafino/config** | `packages/config/` | Shared env/config |
| **@herafino/logger** | `packages/logger/` | Pino logger factory |
| **@herafino/test** | `packages/test/` | Test helpers + factories |

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
