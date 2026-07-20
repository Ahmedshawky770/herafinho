# Multi-stage build for the standalone WebSocket server (real-time location +
# notifications pub/sub). Runs as a long-lived service (NOT on Vercel) and must
# share VALKEY_URL with the web app. Set NEXT_PUBLIC_WS_URL (wss://) in the web
# app to this service's address.
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/workers/package.json ./apps/workers/
COPY packages/shared/package.json ./packages/shared/
COPY packages/types/package.json ./packages/types/
COPY packages/contracts/package.json ./packages/contracts/
RUN npm ci

FROM base AS runner
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1024

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER nodejs
WORKDIR /app/apps/web

CMD ["npm", "run", "ws"]
