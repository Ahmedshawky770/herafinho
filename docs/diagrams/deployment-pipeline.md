# Deployment Architecture - Harfino

```mermaid
flowchart TD
    subgraph "Docker Compose (Production)"
        subgraph "Infrastructure Layer"
            PG[/"PostgreSQL 16<br/>(Docker: postgres:16-alpine)"/]
            Valkey[/"Valkey<br/>(Docker: valkey/valkey:latest)"/]
        end

        subgraph "Application Layer"
            NextApp[("Next.js App<br/>Port 3000 (HTTP) + 3001 (WS)")]
            Worker[("Background Workers<br/>BullMQ + sendEmail")]
            InitJob((Migration Job<br/>drizzle-kit migrate))
        end

        subgraph "Observability"
            Sentry["Sentry<br/>(Error Tracking)"]
            Prometheus["Prometheus<br/>(Metrics)"] --> Grafana["Grafana<br/>(Dashboard)"]
        end
    end

    subgraph "External Services"
        Google["Google OAuth"]
        GoogleMaps["Google Maps API"]
        Resend["Resend Email"]
        Vercel["Vercel Edge Network"]
    end

    subgraph "CI/CD Pipeline (GitHub Actions)"
        GitHub["GitHub Push / PR"]
        LintCheck["Lint + Type Check"]
        TestSuite["Test Suite<br/>(Vitest + Playwright)"]
        DockerBuild["Docker Build"]
        PushRegistry["Push to Docker Hub"]
        Deploy["Deploy to VPS"]
    end

    NextApp --> PG
    NextApp --> Valkey
    Worker --> Valkey
    Worker --> PG
    InitJob --> PG

    NextApp --> Sentry
    NextApp --> Prometheus
    Worker --> Sentry

    NextApp --> Google
    NextApp --> GoogleMaps
    Worker --> Resend

    GitHub --> LintCheck
    LintCheck --> TestSuite
    TestSuite --> DockerBuild
    DockerBuild --> PushRegistry
    PushRegistry --> Deploy

    Deploy --> NextApp
    Deploy --> Worker

    style NextApp fill:#10b981,color:white
    style Valkey fill:#f59e0b,color:white
    style PG fill:#3b82f6,color:white
    style Worker fill:#8b5cf6,color:white
    style Sentry fill:#ef4444,color:white

    linkStyle 0 stroke:#10b981,stroke-width:2px
    linkStyle 1 stroke:#f59e0b,stroke-width:2px
    linkStyle 2 stroke:#8b5cf6,stroke-width:2px
    linkStyle 3 stroke:#3b82f6,stroke-width:2px
```

---

## docker-compose.yml (Development)

```yaml
# docker-compose.yml
# Harfino Development Environment
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: harfino_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: herafino_dev
      POSTGRES_USER: herafino
      POSTGRES_PASSWORD: password
      TZ: Africa/Cairo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - harfino_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U herafino"]
      interval: 5s
      timeout: 3s
      retries: 5

  valkey:
    image: valkey/valkey:8.0.0
    container_name: harfino_valkey
    restart: unless-stopped
    command: valkey-server --appendonly yes --save 30 1
    ports:
      - "6379:6379"
    volumes:
      - valkey_data:/data
    networks:
      - harfino_network
    healthcheck:
      test: ["CMD", "valkey-cli", "ping"]
      interval: 5s
      timeout: 3s

  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    container_name: herafino_app
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://herafino:password@postgres:5432/herafino_dev
      DIRECT_URL: postgres://herafino:password@postgres:5432/herafino_dev
      VALKEY_URL: valkey://valkey:6379
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      NEXT_PUBLIC_WS_URL: ws://localhost:3001
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY}
      SENTRY_DSN: ${SENTRY_DSN}
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      valkey:
        condition: service_healthy
    networks:
      - harfino_network
    command: npm run dev

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: harfino_worker
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://herafino:password@postgres:5432/herafino_dev
      VALKEY_URL: valkey://valkey:6379
      RESEND_API_KEY: ${RESEND_API_KEY}
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      valkey:
        condition: service_healthy
    networks:
      - harfino_network
    command: npm run worker:dev

  mailhog:
    image: mailhog/mailhog:v1.0.1
    container_name: herafino_mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"
    networks:
      - harfino_network
    profiles:
      - dev

volumes:
  postgres_data:
    driver: local
  valkey_data:
    driver: local

networks:
  harfino_network:
    driver: bridge
```

---

## Dockerfile

```dockerfile
# Dockerfile (Multi-stage)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build
RUN npm run db:generate

FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/server ./.next/server
COPY --from=builder --chown=nextjs:nodejs /app/.next/font/static ./.next/font/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

USER nextjs
EXPOSE 3000 3001

ENV NODE_ENV production

CMD ["node", ".next/standalone/server.js"]
```

---

## docker-compose.prod.yml (Production)

```yaml
# docker-compose.prod.yml
# Harfino Production Environment

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: harfino_postgres
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    environment:
      POSTGRES_DB: herafino_prod
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      TZ: Africa/Cairo
    networks:
      - harfino_network
    env_file:
      - .env.production
    secrets:
      - postgres_password

  valkey:
    image: valkey/valkey:8.0.0
    container_name: harfino_valkey
    restart: always
    command: valkey-server --appendonly yes --requirepass ${VALKEY_PASSWORD}
    volumes:
      - valkey_data:/data
    networks:
      - harfino_network
    env_file:
      - .env.production

  app:
    image: ${DOCKER_REGISTRY}/herafino-app:${IMAGE_TAG:-latest}
    container_name: harfino_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      VALKEY_URL: ${VALKEY_URL}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      RESEND_API_KEY: ${RESEND_API_KEY}
      SENTRY_DSN: ${SENTRY_DSN}
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
      NEXT_PUBLIC_WS_URL: ${NEXT_PUBLIC_WS_URL}
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      valkey:
        condition: service_healthy
    networks:
      - harfino_network
    env_file:
      - .env.production
    secrets:
      - valkey_password
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 3s
      retries: 3

  worker:
    image: ${DOCKER_REGISTRY}/herafino-worker:${IMAGE_TAG:-latest}
    container_name: harfino_worker
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      VALKEY_URL: ${VALKEY_URL}
      RESEND_API_KEY: ${RESEND_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      valkey:
        condition: service_healthy
    networks:
      - harfino_network
    env_file:
      - .env.production
    secrets:
      - postgres_password
      - valkey_password

volumes:
  postgres_data:
    driver: local
  valkey_data:
    driver: local

networks:
  harfino_network:
    driver: bridge

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  valkey_password:
    file: ./secrets/valkey_password.txt
```

---

## Secrets Management

```bash
# secrets/postgres_password.txt
herafino_prod_pg_password_here

# secrets/valkey_password.txt
herafino_valkey_password_here

# .env.production (git-ignored)
NODE_ENV=production
DATABASE_URL=postgres://herafino:${POSTGRES_PASSWORD}@postgres:5432/herafino_prod
VALID_URL=postgres://herafino:${POSTGRES_PASSWORD}@postgres:5432/herafino_prod
VALKEY_URL=valkey://:${VALKEY_PASSWORD}@valkey:6379
```

---

## GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    name: Test Suite
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: docker compose up -d postgres valkey
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm audit --production
      - uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
          tags: ghcr.io/${{ github.repository }}/app:${{ github.sha }}
          cache-from: type=registry,ref=ghcr.io/${{ github.repository }}/app:buildcache
          cache-to: type=registry,ref=ghcr.io/${{ github.repository }}/app:buildcache,mode=max

  # Optional: deploy to VPS / Docker Swarm
  # deploy:
  #   name: Deploy to Production
  #   runs-on: ubuntu-latest
  #   needs: [build]
  #   if: github.ref == 'refs/heads/main'
  #   steps:
  #     - uses: appleboy/ssh-action@v1.0.3
  #       with:
  #         host: ${{ secrets.VPS_HOST }}
  #         username: ${{ secrets.VPS_USER }}
  #         key: ${{ secrets.VPS_SSH_KEY }}
  #         script: |
  #           cd /opt/herafino
  #           docker compose pull
  #           docker compose up -d --force-recreate
  #           npm run db:migrate
  #           docker image prune -f
```

---

## Deployment Checklist

```markdown
## Pre-Deployment

- [ ] All tests passing
- [ ] Database migration reviewed + tested on staging
- [ ] Secrets updated in production env
- [ ] Previous Docker images cleaned
- [ ] Valkey persistence enabled (AOF)
- [ ] Monitoring (Sentry, logs) configured

## Deployment Steps

1. Pull latest code
2. Build Docker image
3. Run database migrations (Drizzle)
4. Update Docker containers (app, worker)
5. Verify all services (postgres, valkey, app, worker) healthy
6. Run smoke tests (curl /api/health)
7. Verify WebSocket (ws://localhost:3001)
8. Check Sentry for new errors

## Rollback

1. git revert <commit>
2. docker compose up -d --force-recreate
3. npm run db:rollback (if needed)
```

---

## Monitoring Dashboard

| Alert | Threshold | Notification |
|-------|-----------|--------------|
| API Response Time (p95) | > 500ms | Slack |
| Error Rate | > 1% | Sentry Alert |
| Valkey Hit Rate | < 80% | Grafana |
| PostgreSQL Connections | > 80% of max | Grafana |
| Disk Space | < 20% free | Grafana |
| Worker Job Queue Length | > 1000 | Grafana |

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | ✅ | `development` or `production` |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DIRECT_URL` | ✅ | Direct PostgreSQL connection (for migrations) |
| `VALKEY_URL` | ✅ | Valkey connection string |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth Client Secret |
| `GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API Key |
| `RESEND_API_KEY` | ✅ | Resend email API Key |
| `SENTRY_DSN` | ❌ | Sentry DSN (error tracking) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Application URL |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket URL |
| `POSTGRES_PASSWORD` | ✅ | PostgreSQL password |
| `VALKEY_PASSWORD` | ✅ | Valkey password |
| `DOCKER_REGISTRY` | ✅ | Docker registry URL |
| `IMAGE_TAG` | ❌ | Image tag (default: latest) |

---

## Related Documents
- [C4 L2 - Container](c4-l2-container-deployment.md)
- [Docker Compose Plan](plan.md)
- [Package Dependencies](package.json)
- [ADR-011: Docker Strategy](adr/)
