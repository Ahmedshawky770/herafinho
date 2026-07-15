FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

FROM base AS runner
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app /app

USER nextjs
WORKDIR /app/apps/web

CMD ["npm", "run", "ws"]
