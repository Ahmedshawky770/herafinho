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

FROM base AS builder
ARG DATABASE_URL=postgres://herafino:password@localhost:5432/herafino_dev
ENV DATABASE_URL=$DATABASE_URL
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run db:generate
RUN npm run build

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app
ENV NODE_ENV=development

FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
