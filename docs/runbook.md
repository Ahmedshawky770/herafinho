# Harfino — Operations Runbook

> Production readiness & on-call guide for the Harfino (حرفينو) platform.
> Audience: engineers / DevOps on-call. Keep this file up to date with every
> infrastructure or deployment change.

---

## 1. Architecture at a glance

| Service    | Image / Process      | Port | Notes                                  |
| ---------- | -------------------- | ---- | -------------------------------------- |
| `postgres` | postgres:16-alpine   | 5432 | Primary datastore (Drizzle ORM)        |
| `valkey`   | valkey/valkey:8.0.0  | 6379 | Cache + WebSocket pub/sub + rate-limit |
| `app`      | Next.js (standalone) | 3000 | Web + API + auth                       |
| `ws`       | Node WS server       | 3001 | Real-time location & notifications     |
| `worker`   | BullMQ worker        | —    | Events, emails, outbox processing      |

Required environment (see `.env.example`):
`DATABASE_URL`, `VALKEY_URL`, `GOOGLE_CLIENT_ID/SECRET`, `NEXTAUTH_URL`,
`NEXTAUTH_SECRET`, `RESEND_API_KEY`, `FIRST_USER_ADMIN`, `NEXT_PUBLIC_APP_URL`,
`NEXT_PUBLIC_WS_URL`, `SENTRY_DSN` (optional), `GOOGLE_MAPS_SERVER_KEY` (optional).

---

## 2. Deploying

### Docker Compose (VPS)

```bash
cp .env.example .env.local   # fill in real values
docker compose -f docker-compose.prod.yml up -d --build
npx drizzle-kit migrate --config packages/shared/drizzle.config.json
```

The `app` container runs `curl -f http://localhost:3000/api/health` as a
healthcheck; it is only marked healthy once `/api/health` returns `200`.

### CI/CD

- **Preview**: pushed branches deploy to Vercel preview automatically.
- **Production**: merged `main`/`develop` → SSH deploy job runs `turbo run build`
  then `docker compose -f docker-compose.prod.yml up -d --build`.
- **Quality gates** (must pass before merge): `lint`, `typecheck`, unit +
  integration tests, **security** (npm audit + Semgrep + Gitleaks), and **E2E**
  (Playwright against a live dev server with Postgres/Valkey).

---

## 3. Health & monitoring

- **Liveness/readiness**: `GET /api/health` (public, no auth).
  Returns `{ status: 'healthy' | 'degraded' | 'unhealthy', checks: { database, valkey } }`.
  - `200` healthy, `503` degraded (a dependency is down), `500` unhealthy.
  - The endpoint never leaks internal error messages in production.
- **Error tracking**: Sentry is initialized in `apps/web/src/instrumentation.ts`
  (via `withSentryConfig`). Set `SENTRY_DSN` to activate; monitoring is a no-op
  when the DSN is empty. Tracing/profiling sample rates are lowered in production
  to control cost.
- **Logs**: structured JSON via `pino`. Emitted as JSON in production for log
  ingestion.

### Quick checks

```bash
curl -s http://localhost:3000/api/health | jq .
docker compose -f docker-compose.prod.yml logs --tail=100 app
docker compose -f docker-compose.prod.yml logs --tail=100 ws
docker compose -f docker-compose.prod.yml logs --tail=100 worker
```

---

## 4. Common incidents & first response

| Symptom                                              | Likely cause                                       | First response                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `/api/health` → `503 degraded`, `valkey` unhealthy   | Valkey down / auth failure                         | `docker compose restart valkey`; check `VALKEY_URL`/`VALKEY_PASSWORD`. WS + rate-limit degrade without it. |
| `/api/health` → `503 degraded`, `database` unhealthy | Postgres unreachable                               | `docker compose restart postgres`; verify `DATABASE_URL`.                                                  |
| Logins fail / redirect loop                          | `NEXTAUTH_SECRET` mismatch or `NEXTAUTH_URL` wrong | Same secret across replicas; `NEXTAUTH_URL` must equal public origin.                                      |
| Redirects to `/unauthorized`                         | Role/RBAC mismatch                                 | Confirm `users.role`; check middleware + route `requireAdmin` guards.                                      |
| WS clients not receiving live updates                | WS down or Valkey pub/sub broken                   | Check `ws` logs; verify `WS_PORT=3001` + Valkey connectivity.                                              |
| Emails not sent                                      | Resend key missing/invalid                         | Verify `RESEND_API_KEY` + `RESEND_FROM_EMAIL`.                                                             |
| Craftsman can't reach dashboard                      | Onboarding gate                                    | Profile must be `approved`; `resolveOnboardingComplete` syncs the flag.                                    |

---

## 5. Database

- **Migrations** live in `packages/shared/src/db/migrations/*.sql` (Drizzle).
  Always migrate before deploying a new app version.
- **Rollback**: Drizzle Kit does not auto-rollback. Revert the migration SQL
  manually in a maintenance window and bump a new migration.
- **Backups**: `pg_dump "$DATABASE_URL" > backup_$(date +%F).sql` before risky work.
- **Connection**: `DIRECT_URL` for `drizzle-kit` (direct), `DATABASE_URL` for app (pooled).

```bash
pg_dump "$DATABASE_URL" > backup_$(date +%F).sql
npx drizzle-kit migrate --config packages/shared/drizzle.config.json
npx drizzle-kit generate --config packages/shared/drizzle.config.json
```

---

## 6. Secrets & security

- Never commit `.env*` (gitignored). Use the platform secret store in production.
- `GOOGLE_MAPS_SERVER_KEY` must be a **server** key, separate from the public
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Server geocoding is disabled until set.
- Rotate `NEXTAUTH_SECRET` and `VALKEY_PASSWORD` on a schedule (full restart needed).
- CI runs Gitleaks on every push — a committed secret fails the build.

---

## 7. Emergency procedures

```bash
docker compose -f docker-compose.prod.yml restart
# Rollback: pin previous tag in compose file, then:
docker compose -f docker-compose.prod.yml up -d --build
# Maintenance drain:
docker compose -f docker-compose.prod.yml stop app ws worker
docker compose -f docker-compose.prod.yml start app ws worker
```

**Escalation:** page on-call; if data loss is possible, involve DBA before manual
SQL. Post `/api/health` output + container logs in the incident channel.

### Vercel (Web App) + Separate Services (WS / Workers)

The Next.js **web app** is the only component deployed to Vercel. The
**WebSocket server** (port 3001) and the **BullMQ workers** are long-running
processes that Vercel's serverless model does not host, so they must run as
separate services. Deploying the web app alone still gives a working site; the
real-time location feed and background jobs (email, webhooks, outbox processing)
require the extra services below.

**Vercel web app**

- Build command: `npx turbo run build --force`
- Install command: `npm install`
- All server env vars used by the app must be declared in `turbo.json`
  `globalEnv` (and set in the Vercel project) or they will be `undefined` at
  build/runtime. See `.env.example` for the full list.
- `vercel.json` must NOT contain `nodeVersion` (unsupported key); pin the Node
  version via Project Settings → Node.js Version instead.

**WebSocket server** (`apps/web/src/ws`, `npm run ws`)

- Deploy as a long-running service (Railway, Render, Fly.io, a VPS container,
  or a Node server process). It is NOT covered by the Vercel deployment.
- Must share the same `VALKEY_URL` as the web app (used for pub/sub fan-out).
- Expose it behind TLS and set `NEXT_PUBLIC_WS_URL` in the web app to its
  `wss://` address. The client gracefully falls back to 30s polling if the
  socket is unavailable (`ws-provider.tsx`).

**Workers** (`apps/workers`, `npm run worker`)

- Deploy as a long-running service sharing `DATABASE_URL` + `VALKEY_URL`.
- Required vars: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (email queue),
  webhook secrets (webhook dispatch), `OUTBOX_POLL_INTERVAL_MS` (outbox
  processor), `WORKER_ID` (idempotency across replicas).

**Migration step (required on every environment)**

```bash
npx drizzle-kit migrate --config packages/shared/drizzle.config.json
```

Run this against the target database before starting the app/workers.

### One-click Blueprint (Render)

`render.yaml` at the repo root defines the two long-running services as a
Render "Blueprint":

- `herafino-ws` (type `web`, Dockerfile `Dockerfile.ws`) — exposes the WS server
  on `$PORT`; set `NEXT_PUBLIC_WS_URL=wss://<herafino-ws>.onrender.com` in the
  **Vercel** web app so the client connects to it.
- `herafino-worker` (type `worker`, Dockerfile `Dockerfile.worker`) — consumes
  BullMQ queues + the event outbox.

Connect the repo in Render → New → Blueprint, and set the `sync: false` env
vars (`DATABASE_URL`, `DIRECT_URL`, `VALKEY_URL`, `RESEND_API_KEY`,
`RESEND_FROM_EMAIL`, `NEXT_PUBLIC_WS_URL`) in the Render dashboard. The web app
itself stays on Vercel; the Blueprint does not deploy it.
