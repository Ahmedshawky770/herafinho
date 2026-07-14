# Harfino — Project Execution Plan

> **Version**: 1.0.0  
> **Status**: Approved for Implementation  
> **Owner**: Ahmed Shawky  
> **Date**: 2026-07-01  
> **License**: MIT + Egyptian Attribution

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Scope](#2-product-vision--scope)
3. [Engineering Principles](#3-engineering-principles)
4. [Scope Breakdown (MVP)](#4-scope-breakdown-mvp)
5. [Architecture & Tech Stack](#5-architecture--tech-stack)
6. [Database Design (PostgreSQL + Drizzle)](#6-database-design-postgresql--drizzle)
7. [Module Boundaries](#7-module-boundaries)
8. [Contracts & Interfaces](#8-contracts--interfaces)
9. [Valkey Caching Strategy](#9-valkey-caching-strategy)
10. [Authentication Flow](#10-authentication-flow)
11. [Realtime Location System](#11-realtime-location-system)
12. [Craftsman Onboarding Flow](#12-craftsman-onboarding-flow)
13. [Order Lifecycle](#13-order-lifecycle)
14. [Moderation & 3-Strike Ban](#14-moderation--3-strike-ban)
15. [Webhook Architecture](#15-webhook-architecture)
16. [Testing Strategy](#16-testing-strategy)
17. [CI/CD Pipeline](#17-cicd-pipeline)
18. [Security & Compliance](#18-security--compliance)
19. [Observability](#19-observability)
20. [Deployment Architecture](#20-deployment-architecture)
21. [Feature Roadmap](#21-feature-roadmap)
22. [Risk Register](#22-risk-register)
23. [ADRs Index](#23-adrs-index)
24. [Appendix — Diagrams Index](#24-appendix--diagrams-index)

---

## 1. Executive Summary

**Harfino** is an Egyptian craftsmen-to-client marketplace platform (an "Uber for blue-collar trades"). It connects verified tradespeople — carpenters, plumbers, electricians, etc. — with clients who need services, with location-aware realtime tracking, reviews, moderation, and a full admin pipeline.

**Architecture**: Modular Monolith on **Next.js 16+ App Router**, **PostgreSQL (Drizzle ORM)** as SSOT, **Valkey** (Redis-compatible) for cache + distributed queue, **BullMQ** for background jobs, **NextAuth + Google OAuth** for auth, **React Query** for client state, **WebSocket** for realtime location, **Tailwind CSS** for styling with custom `global.css`, and **PWA** for mobile installability.

**Deployment**: Docker Compose (local), Docker Swarm / VPS (production), GitHub Actions CI/CD.

---

## 2. Product Vision & Scope

### Vision
Enable Egyptian clients to find, book, and review trusted tradespeople with confidence, while giving tradespeople a fair, verified platform to grow their business.

### Non-Negotiables
- **Egyptian-first**: Phone validation, Arabic RTL, Egyptian craft taxonomy.
- **Verification-first**: Every craftsman must pass admin review (ID + photo + transport + address) before going live.
- **Trust-first**: 3-strike freeze/auto-ban rule; complaints + audit trail + webhooks.
- **Performance-first**: Valkey cache, React Query, async/await webhook dispatch, PostGIS spatial queries.

### Out of Scope (MVP)
- In-app payments (future)
- Chat/messaging between client and craftsman (future)
- Multi-city expansion beyond Egypt (future)

---

## 3. Engineering Principles

Harfino is built on **13 core engineering principles** defined by Ahmed Shawky:

| # | Principle | Enforcement |
|---|-----------|-------------|
| 1 | **No `any` / `as any`** in TypeScript | ESLint rule + CI gate |
| 2 | **Structured logging** (Pino) — no `console.log` in production | Logger factory + code review |
| 3 | **All IDs are strings** | TypeScript `type ID = string` + lint rule |
| 4 | **ADRs for every architectural decision** | Mandatory for decisions > 1 day |
| 5 | **Design-first** (C4 Model before code) | Diagram review before PR |
| 6 | **Minimize DB migrations** | Schema planned upfront; nullable + default first |
| 7 | **Loose coupling** (modules talk via Contracts/Events) | No direct cross-module imports |
| 8 | **Open/Closed Principle** (extend, don't modify) | Interfaces + Factories |
| 9 | **SSOT** (PostgreSQL = single source of truth) | Valkey = ephemeral cache only |
| 10 | **Unified typing** (types/ folder as SSOT for TS) | Monorepo: packages/types |
| 11 | **Valkey Docker for caching** | Never ioredis / Redis in codebase |
| 12 | **Resilience** (Circuit Breaker + Retry + no Cascade Failures) | Async webhook dispatch + Dead Letter Queue |
| 13 | **Automate massive refactoring** (protect rescue, then fix abstraction) | Code mods via ast-grep / jscodeshift |

---

## 4. Scope Breakdown (MVP)

### 4.1 Actors & Roles

| Role | Auth Method | Onboarding | Approval |
|------|-------------|------------|----------|
| **Client** | Google OAuth | None (immediate) | None |
| **Craftsman** | Google OAuth | 9-step wizard (profile, docs, transport, location) | Admin review (≤48h) |
| **Admin** | Google OAuth (pre-seeded `role=admin`) | None | N/A |
| **Super Admin** | Google OAuth (single account) | None | N/A |

### 4.2 Feature Matrix

| Feature | Client | Craftsman | Admin |
|---------|--------|-----------|-------|
| Google OAuth login | ✅ | ✅ | ✅ |
| Search craftsmen by craft + location | ✅ | ❌ | ✅ |
| View craftsman profile | ✅ | ✅ (own) | ✅ |
| Create order | ✅ | ❌ | ✅ |
| Accept/reject order | ❌ | ✅ | ❌ |
| Realtime location tracking (map) | ✅ | ✅ | ✅ |
| Submit review (1-5 stars) | ✅ | ❌ | ❌ |
| File complaint | ✅ | ❌ | ❌ |
| Onboarding / profile management | ❌ | ✅ | ❌ |
| Admin review queue | ❌ | ❌ | ✅ |
| Moderation (warn / freeze / ban) | ❌ | ❌ | ✅ |
| Audit logs viewer | ❌ | ❌ | ✅ |
| Webhook management | ❌ | ❌ | ✅ |

---

## 5. Architecture & Tech Stack

### 5.1 High-Level Stack

```
┌──────────────────────────────────────────────────────┐
│                     Harfino Stack                    │
├──────────────┬───────────────────────────────────────┤
│ Layer        │ Technology                            │
├──────────────┼───────────────────────────────────────┤
│ Frontend     │ Next.js 16+, React, Tailwind CSS      │
│              │ React Query (TanStack Query v5)       │
│              │ PWA (next-pwa)                        │
├──────────────┼───────────────────────────────────────┤
│ Backend      │ Next.js Route Handlers (API + WS)     │
│              │ Drizzle ORM (type-safe queries)       │
│              │ Zod (runtime validation)              │
├──────────────┼───────────────────────────────────────┤
│ Auth         │ NextAuth v4 (Auth.js)                 │
│              │ Google OAuth 2.0 (PKCE recommended)   │
│              │ JWT sessions (stateless)              │
├──────────────┼───────────────────────────────────────┤
│ Database     │ PostgreSQL 16+                        │
│              │ PostGIS (spatial queries)             │
│              │ UUID PKs + ENUMs                      │
├──────────────┼───────────────────────────────────────┤
│ Cache        │ Valkey (Redis-compatible fork)        │
│              │ node-valkey client                    │
│              │ BullMQ (backed by Valkey)             │
├──────────────┼───────────────────────────────────────┤
│ Realtime     │ WebSocket (ws / uWebSockets)          │
│              │ Browser Geolocation API               │
├──────────────┼───────────────────────────────────────┤
│ Background   │ Node.js Workers (BullMQ)              │
│              │ Resend (email transport)              │
├──────────────┼───────────────────────────────────────┤
│ Observability│ Pino (structured logging)             │
│              │ Sentry (error tracking)               │
│              │ Prometheus + Grafana (optional)       │
├──────────────┼───────────────────────────────────────┤
│ Infra        │ Docker + Docker Compose               │
│              │ GitHub Actions CI/CD                  │
└──────────────┴───────────────────────────────────────┘
```

### 5.2 Why This Stack (Anti-pattern Avoidance)
- **Not ioredis / Redis**: Valkey (open-source fork, no SSPL license risk).
- **Not Prisma**: Drizzle ORM (smaller bundle, explicit SQL, better for complex schemas).
- **Not REST-only**: WebSocket for realtime location + React Query for optimistic UI.
- **Not vanilla React state**: React Query as single source for server state; zustand only for UI state.
- **Not separate frontend/backend repos**: Next.js fullstack keeps deployment + contracts simple.

---

## 6. Database Design (PostgreSQL + Drizzle)

### 6.1 Golden Schema

All tables are defined in `packages/shared/src/db/schema.ts`. This is the **source of truth** for the data model.

### 6.2 Key Tables

```typescript
// users
export const users = pgTable('users', {
  id: text('id').primaryKey(), // UUID
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  name: text('name').notNull(),
  image: text('image').notNull(),
  googleId: text('google_id').unique(),
  role: text('role', { enum: ['client', 'craftsman', 'admin', 'super_admin'] }).default('client'),
  phone: text('phone'),
  age: integer('age'),
  bannedAt: timestamp('banned_at'),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// craftsman_profiles
export const craftsmanProfiles = pgTable('craftsman_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  craftType: text('craft_type', { enum: ['carpenter', 'plumber', 'painter', 'electrician', 'welder', 'tiler', 'ceramicist', 'whitewasher', 'hvac', 'satellite', 'aluminum'] }).notNull(),
  experienceYears: integer('experience_years').notNull(),
  idCardFrontUrl: text('id_card_front_url').notNull(),
  idCardBackUrl: text('id_card_back_url').notNull(),
  facePhotoUrl: text('face_photo_url').notNull(),
  transportType: text('transport_type', { enum: ['bike', 'walking', 'car', 'minivan'] }).notNull(),
  transportPhotos: jsonb('transport_photos').$type<string[]>(),
  vehicleNumber: text('vehicle_number'),
  workshopAddress: text('workshop_address').notNull(),
  workshopLatitude: text('workshop_latitude').notNull(),
  workshopLongitude: text('workshop_longitude').notNull(),
  isAvailable: boolean('is_available').default(false),
  isOnline: boolean('is_online').default(false),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'frozen'] }).default('pending'),
  freezeUntil: timestamp('freeze_until'),
  freezeReason: text('freeze_reason'),
  freezeCount: integer('freeze_count').default(0),
  rejectionReason: text('rejection_reason'),
  reviewedBy: text('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// craftsman_locations (realtime)
export const craftsmanLocations = pgTable('craftsman_locations', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  isAvailable: boolean('is_available').notNull(),
});

// orders
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  clientId: text('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  craftsmanId: text('craftsman_id').references(() => users.id, { onDelete: 'cascade' }),
  craftType: text('craft_type', { enum: ['carpenter', 'plumber', 'painter', 'electrician', 'welder', 'tiler', 'ceramicist', 'whitewasher', 'hvac', 'satellite', 'aluminum'] }).notNull(),
  status: text('status', { enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'] }).default('pending'),
  description: text('description').notNull(),
  address: text('address').notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  estimatedPrice: text('estimated_price'),
  finalPrice: text('final_price'),
  scheduledAt: timestamp('scheduled_at'),
  completedAt: timestamp('completed_at'),
  clientAcceptedFinalPrice: boolean('client_accepted_final_price'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// reviews
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull().unique(),
  clientId: text('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  craftsmanId: text('craftsman_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull().refined((val) => val >= 1 && val <= 5),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// complaints
export const complaints = pgTable('complaints', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id),
  reporterId: text('reporter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  againstUserId: text('against_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reason: text('reason', { enum: ['no_show', 'bad_service', 'overpriced', 'harassment', 'fraud', 'other'] }).notNull(),
  description: text('description').notNull(),
  evidenceUrls: jsonb('evidence_urls').$type<string[]>(),
  status: text('status', { enum: ['pending', 'investigating', 'resolved', 'dismissed'] }).default('pending'),
  actionTaken: text('action_taken', { enum: ['warning', 'freeze', 'permanent_ban'] }),
  resolvedBy: text('resolved_by').references(() => users.id, { onDelete: 'set null' }),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// audit_logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type', { enum: ['email', 'in_app', 'push'] }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: boolean('read').default(false),
  readAt: timestamp('read_at'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
});

// webhooks
export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey(),
  event: text('event').notNull(),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  isActive: boolean('is_active').default(true),
  retryCount: integer('retry_count').default(0),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 6.3 Critical Indexes

```typescript
// idx_craftsman_profiles_status_craft
createIndex('idx_craftsman_profiles_status_craft')
  .on(craftsmanProfiles.status, craftsmanProfiles.craftType)
  .where(eq(craftsmanProfiles.status, 'approved')),

// idx_craftsman_locations_user_id
createIndex('idx_craftsman_locations_user_id').on(craftsmanLocations.userId),

// idx_orders_client_id
createIndex('idx_orders_client_id').on(orders.clientId),

// idx_orders_craftsman_id_status
createIndex('idx_orders_craftsman_id_status').on(orders.craftsmanId, orders.status),

// idx_reviews_craftsman_id
createIndex('idx_reviews_craftsman_id').on(reviews.craftsmanId),

// idx_complaints_against_user_id_status
createIndex('idx_complaints_against_user_id_status').on(complaints.againstUserId, complaints.status),

// idx_audit_logs_actor_id
createIndex('idx_audit_logs_actor_id').on(auditLogs.actorId),

// idx_webhooks_event
createIndex('idx_webhooks_event').on(webhooks.event),
```

### 6.4 Migration Rules
- All new columns must have `default` values or be nullable.
- No `ALTER TABLE ... DROP COLUMN` in production without explicit migration plan.
- All migrations live in `apps/web/src/lib/db/migrations/` and are committed to git.
- Zero tolerance for `any` in migration scripts.

---

## 7. Module Boundaries

### 7.1 Module List

| Module | Responsibility | Key Entities | Events Emitted |
|--------|---------------|--------------|----------------|
| **Auth** | OAuth login, session, JWT middleware | User, Session | `UserRegisteredEvent`, `UserLoggedInEvent` |
| **User** | Profile CRUD, role management | User | `UserUpdatedEvent` |
| **Craftsman** | Onboarding, approval, freeze/ban, availability | CraftsmanProfile, CraftsmanLocation | `CraftsmanRegisteredEvent`, `CraftsmanApprovedEvent`, `CraftsmanRejectedEvent`, `CraftsmanFrozenEvent`, `CraftsmanBannedEvent` |
| **Order** | Order creation, accept/reject/completion | Order | `OrderCreatedEvent`, `OrderAcceptedEvent`, `OrderCompletedEvent` |
| **Review** | Review creation, rating aggregation | Review | `ReviewCreatedEvent` |
| **Complaint** | Complaint filing, investigation, moderation | Complaint | `ComplaintFiledEvent`, `ComplaintResolvedEvent` |
| **Location** | Static (workshop) + realtime location, WS connection | CraftsmanLocation | `CraftsmanLocationUpdatedEvent`, `CraftsmanOnlineStatusChangedEvent` |
| **Notification** | Email (Resend), in-app, push | Notification | `NotificationSentEvent` |
| **Admin** | Review queue, moderation actions, audit viewer | AdminReview, UserAction | `AdminActionTakenEvent` |
| **Webhook** | Outgoing webhook dispatch, retry, DLQ | Webhook, WebhookDeliveryLog | — |
| **Audit** | Immutable audit trail | AuditLog | — |

### 7.2 Dependency Direction
```
External (Next.js, API Routes, WS)
        ↓
  Application Layer (Use Cases)
        ↓
    Contracts / Interfaces
        ↓
  Infrastructure Layer (Repositories, Services)
        ↓
  Domain Layer (Pure Entities, Events)
```

**No direct imports between modules** at the Application or Domain layers. Inter-module communication happens exclusively via Domain Events dispatched through an internal Event Bus backed by Valkey Pub/Sub + PostgreSQL outbox.

---

## 8. Contracts & Interfaces

All interfaces are defined in `packages/contracts/src/`. Every implementation must satisfy its contract. Contract tests verify implementations.

```typescript
// Example: IUserRepository
export interface IUserRepository {
  findById(id: ID): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  update(id: ID, data: Partial<User>): Promise<User>;
  softDelete(id: ID): Promise<void>;
}

// Example: IEmailService
export interface IEmailService {
  sendWelcome(email: string, name: string): Promise<void>;
  sendApprovalNotification(email: string, name: string): Promise<void>;
  sendRejectionNotification(email: string, name: string, reason?: string): Promise<void>;
  sendOrderNotification(email: string, order: Order): Promise<void>;
  sendBanNotification(email: string, reason: string): Promise<void>;
}

// Example: ILocationService
export interface ILocationService {
  getGeocode(address: string): Promise<{ lat: string; lng: string }>;
  updateCraftsmanLocation(userId: ID, lat: string, lng: string, available: boolean): Promise<void>;
  getNearbyCraftsmen(lat: string, lng: string, craftType: string, radiusKm: number): Promise<CraftsmanLocation[]>;
}
```

---

## 9. Valkey Caching Strategy

### 9.1 Cache Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Browser HTTP** | Vercel Edge / next-pwa | Static assets, ISR pages |
| **Client State** | React Query (TanStack Query) | Server state mirror, optimistic UI |
| **Application Cache** | Valkey | Hot data (profiles, lists, session, rate limit) |
| **Database** | PostgreSQL 16 + PostGIS | SSOT (single source of truth) |

### 9.2 Key Patterns

| Cache Strategy | Data | TTL |
|----------------|------|-----|
| **Cache-Aside** | `craftsman:profile:{id}` | 5 minutes |
| **Cache-Aside** | `craftsmen:nearby:{geohash}:{craftType}` | 2 minutes |
| **Write-Through** | `craftsman:location:{id}` | 60 seconds (heartbeat) |
| **TTL** | `session:{sessionId}` | 24 hours |
| **Sliding Window** | `rate_limit:{ip}:{endpoint}` | Per request |

### 9.3 Invalidation Rules

- **Profile update** → `DEL craftsman:profile:{id}` + `DEL craftsmen:nearby:*`
- **Order status change** → `DEL order:{id}` + `DEL craftsman:orders:active:{id}`
- **Review created** → `DEL ratings:craftsman:{id}` + `DEL craftsman:profile:{id}`
- **Craftsman banned** → `DEL craftsman:profile:{id}` + Webhook for external cache purge

---

## 10. Authentication Flow

### 10.1 Tech: NextAuth v4 + Google OAuth 2.0

```
Client/Craftsman clicks "Sign in with Google"
    ↓
NextAuth redirects to Google OAuth
    ↓
Google consent screen
    ↓
Google redirects back to `/api/auth/callback/google`
    ↓
NextAuth exchanges code for tokens
    ↓
NextAuth looks up user by googleId (or creates new)
    ↓
JWT session created (24h TTL) → stored in secure cookie
    ↓
If role == 'craftsman' && onboarding incomplete → /onboarding
If role == 'client' → / (home)
```

### 10.2 Session Model
```typescript
interface HarfinoSession {
  userId: string;
  email: string;
  name: string;
  image: string;
  role: 'client' | 'craftsman' | 'admin' | 'super_admin';
  googleId: string;
  iat: number;
  exp: number;
}
```

---

## 11. Realtime Location System

### 11.1 Architecture

```
Craftsman Browser (Geolocation API)
    | [watchPosition every 5-10s]
    ↓
WebSocket Server (Next.js :3001)
    | [Verify JWT, validate role=craftsman]
    ↓
    ├──► Valkey: SET craftsman:location:{userId} { lat, lng, is_online, updated_at }
    │        TTL: 60s (heartbeat)
    │
    ├──► PostgreSQL: UPSERT craftsman_locations
    │
    └──► Broadcast to room: 'craftsman:{userId}'
            |
            ▼
Client Browsers (React Query + WS listener)
    └──► Map shows craftsman marker + ETA
```

### 11.2 Fallback
- If WebSocket fails → Poll every 30 seconds via React Query `refetchInterval`.
- If GPS blocked → Last known location (cached in localStorage).

---

## 12. Craftsman Onboarding Flow

### 12.1 9-Step Wizard

```mermaid
flowchart TD
    Start([Craftsman OAuth Login]) --> Step1[1. Craft Type Selection]
    Step1 --> Step2[2. Egyptian Phone Number]
    Step2 --> Step3[3. Age]
    Step3 --> Step4[4. Years of Experience]
    Step4 --> Step5[5. ID Card Front + Back Upload]
    Step5 --> Step6[6. Face Photo Upload]
    Step6 --> Step7{7. Transport Type}
    Step7 -->|car| Step7Car[Vehicle Number + Photo Upload]
    Step7 -->|bike| Step7Bike[Bike Photo Upload]
    Step7 -->|walking| Step7Walk[No additional media]
    Step7 -->|minivan| Step7Van[Van Photo Upload]
    Step7Car --> Step8
    Step7Bike --> Step8
    Step7Walk --> Step8
    Step7Van --> Step8
    Step8[8. Workshop Address Input]
    Step8 --> Step9[9. Confirm on Google Maps]
    Step9 --> Submit[Submit for Review]
    Submit --> Admin[Admin Review ≤48h]
    Admin -->|approve| Live[Profile Live]
    Admin -->|reject| Blocked[Banned — cannot re-register]
```

### 12.2 Validation Rules
- **Phone**: Must match Egyptian format `01[0125][0-9]{8}` (Zod regex).
- **ID Uploads**: Max 5MB, JPG/PNG only.
- **Age**: 18–80.
- **Experience**: 0–50 years.
- **Workshop**: Must geocode successfully via Google Maps API.
- **Transport**: If `car`, `vehicleNumber` is required (Egyptian plates format `[A-Z]{2,3} \d{3,4}`).

---

## 13. Order Lifecycle

```
pending ──(accept)──► accepted ──(in_progress)──► completed ◄── review
   │                      │                       │
   │(reject)              │(cancel)               │
   ▼                      ▼                       │
rejected              cancelled                  │
   │                                         (submit review)
   │(timeout 48h)                                   │
   └───────────────────────────────────────────────┘
```

- **Pending timeout**: 48 hours → auto-reject.
- **Client cancellation**: Allowed only before craftsman accepts.
- **Craftsman cancellation**: Allowed only before pickup (rare).
- **Review window**: 7 days after completion.
- **Price**: `estimatedPrice` set by client; `finalPrice` set by craftsman before completion.

---

## 14. Moderation & 3-Strike Ban

### 14.1 Moderation Actions

| Action | Effect | Recurrence |
|--------|--------|------------|
| `warning` | In-app + email notification. No functional impact. | — |
| `freeze` | Account frozen 30 days. Cannot accept orders. | `freeze_count++`. If >= 3 → auto-ban. |
| `permanent_ban` | `is_deleted = true`. Cannot log in. Webhook dispatched. | Irreversible. |

### 14.2 3-Strike Enforcement (Code)
```typescript
export async function applyModerationAction(complaintId: string, action: ModerationAction, adminId: string) {
  const complaint = await complaintRepo.findById(complaintId);
  const profile = await craftsmanRepo.findProfileByUserId(complaint.againstUserId);

  if (action === 'freeze') {
    const newFreezeCount = (profile.freezeCount || 0) + 1;
    await craftsmanRepo.updateProfile(profile.id, {
      status: newFreezeCount >= 3 ? 'banned' : 'frozen',
      freezeCount: newFreezeCount,
      freezeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    if (newFreezeCount >= 3) {
      await userRepo.softDelete(profile.userId);
      await webhookDispatcher.dispatch('craftsman.banned', { userId: profile.userId, reason: '3-strike auto-ban' });
    }
  }
}
```

---

## 15. Webhook Architecture

### 15.1 Outgoing Events
- `craftsman.approved`
- `craftsman.rejected`
- `craftsman.banned`
- `order.created`
- `order.accepted`
- `order.completed`
- `review.created`
- `complaint.filed`
- `complaint.resolved`

### 15.2 Delivery Guarantees
- **At-least-once** via BullMQ retry (3 attempts, exponential backoff).
- **DLQ** after 3 failures → alert via Sentry + Slack.
- **Idempotency**: Webhook payload includes `eventId` (UUID) for deduplication.
- **Security**: HMAC-SHA256 signature using per-webhook `secret` stored in `webhooks` table.
- **Timing**: Async dispatch (fire-and-forget via BullMQ). No synchronous HTTP in request path.

---

## 16. Testing Strategy

### 16.1 Test Pyramid (70/20/10)

```
         /\   10% E2E (Playwright)
        /  \   Critical user journeys
       /____\
      /      \ 20% Integration (Vitest + Supertest)
     /________\ API contracts, module boundaries
    /          \
   /  70% Unit  \ Pure domain + application logic
  /______________\
```

### 16.2 Coverage Targets
| Layer | Target | Gate |
|-------|--------|------|
| Unit | 85% | Required before PR merge |
| Integration | 70% | Required before PR merge |
| E2E | Critical paths | Required pre-deploy |
| Overall | 80% | Required |

### 16.3 Critical Test Scenarios
1. Google OAuth login → user creation + session.
2. Craftsman onboarding → profile creation → admin approval/rejection.
3. 3-strike auto-ban enforcement.
4. Order creation → craftsman accept → rejection.
5. Complaint filing → admin resolution → freeze/ban.
6. Webhook dispatch + retry + DLQ behavior.
7. Valkey cache hit/miss behavior.
8. WebSocket location broadcast + client update.

---

## 17. CI/CD Pipeline

### 17.1 GitHub Actions Pipeline

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    needs: lint
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: herafino_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
      valkey:
        image: valkey/valkey:8.0.0
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: docker compose -f docker-compose.test.yml up -d
      - run: npm run test:unit
      - run: npm run test:integration

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
          tags: ghcr.io/${{ github.repository }}/app:${{ github.sha }}

  deploy-preview:
    needs: build
    if: github.event.pull_request
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to Vercel preview"

  deploy-prod:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/herafino
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d --force-recreate
            npm run db:migrate
```

---

## 18. Security & Compliance

### 18.1 Security Controls
- **Input validation**: Zod on every API input.
- **SQL injection**: Prevented by Drizzle ORM parameterized queries.
- **XSS**: DOMPurify for rendered HTML; CSP header.
- **CSRF**: NextAuth built-in CSRF tokens + custom middleware.
- **Rate limiting**: Valkey-backed sliding window per IP/endpoint.
- **Secrets**: Never in git. Docker secrets + .env.local (gitignored).
- **PII**: `is_deleted` soft-delete; audit trail immutable.

### 18.2 Security Headers
```typescript
const headers = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(self)' },
];
```

### 18.3 GDPR Considerations
- Right to deletion: `softDelete(userId)` cascades.
- Audit logs: append-only, never update/delete.
- Data export: `/api/user/export` (future).

---

## 19. Observability

### 19.1 Structured Logging (Pino)
```typescript
import pino from 'pino';
import { randomUUID } from 'crypto';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatter: (log) => ({
    ...log,
    timestamp: new Date().toISOString(),
    service: 'herafino',
    requestId: randomUUID(),
  }),
});
```

### 19.2 Error Tracking (Sentry)
- Instrument Next.js route handlers and client components.
- Tag errors with `userId`, `craftsmanId`, `orderId`.
- Alert on critical error spikes.

### 19.3 Metrics (Prometheus + Grafana)
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API p95 latency | < 500ms | > 1000ms |
| Valkey hit rate | > 80% | < 60% |
| Error rate (5xx) | < 1% | > 5% |
| PostgreSQL query p95 | < 100ms | > 500ms |
| WebSocket connections | Monitor | Spike alert |

---

## 20. Deployment Architecture

### 20.1 Docker Compose (Development)
```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]
  valkey:
    image: valkey/valkey:8.0.0
    ports: ["6379:6379"]
  app:
    build: .
    ports: ["3000:3000", "3001:3001"]
    environment:
      DATABASE_URL: postgres://herafino:password@postgres:5432/herafino_dev
      VALKEY_URL: valkey://valkey:6379
    depends_on: [postgres, valkey]
  worker:
    build: .
    command: tsx apps/workers/src/index.ts
    environment:
      DATABASE_URL: postgres://herafino:password@postgres:5432/herafino_dev
      VALKEY_URL: valkey://valkey:6379
```

### 20.2 Docker Compose (Production)
- `docker-compose.prod.yml`: Secrets via Docker secrets, health checks, restart policies.
- Multi-stage Dockerfiles for `app` and `worker`.
- Valkey AOF persistence enabled.

### 20.3 Deployment Checklist
- [ ] All tests passing (unit + integration + e2e)
- [ ] Database migrations reviewed on staging
- [ ] Secrets rotated + injected via Docker secrets
- [ ] Sentry DSN configured
- [ ] Valkey AOF + backup verified
- [ ] Health checks passing (`/api/health`)
- [ ] Sentry no new errors for 15 minutes post-deploy

---

## 21. Feature Roadmap

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1** | Weeks 1–2 | Infrastructure: DB, Valkey, Next.js, Drizzle schema, Logger, Auth |
| **Phase 2** | Weeks 3–4 | Auth module + User module + middleware + types/ contracts/ |
| **Phase 3** | Weeks 5–7 | Craftsman module + Onboarding (9 steps) + File upload + Admin review |
| **Phase 4** | Week 8 | Location module (static geocoding + realtime WebSocket) + Valkey caching |
| **Phase 5** | Weeks 9–10 | Order module (create, accept/reject, track, complete) + React Query |
| **Phase 6** | Weeks 11–12 | Review module + Complaint module + 3-strike auto-ban + webhooks |
| **Phase 7** | Weeks 13–14 | Admin dashboard + audit logs + moderation actions |
| **Phase 8** | Week 15 | Notifications (email + in-app) + PWA |
| **Phase 9** | Weeks 16–17 | Polish, Performance audit, Load testing, CI/CD production deploy |

---

## 22. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| 1 | Google OAuth rate limits / downtime | Low | High | Fallback: manual auth (future); cache sessions in Valkey |
| 2 | Valkey cluster instability | Medium | High | AOF persistence; fallback to PostgreSQL cache reads |
| 3 | Drizzle migration breaking change | Low | High | Review migrations on staging; always provide rollback SQL |
| 4 | WebSocket scaling (single Node.js instance) | Medium | Medium | Multi-instance behind ALB; use Valkey Pub/Sub for cross-process broadcast |
| 5 | Admin review SLA breach (>48h) | Medium | Medium | Auto-reminder emails; escalation to super admin |
| 6 | Photo upload abuse / large files | Medium | Low | Presigned S3 URLs; max file size 5MB; content-type check |
| 7 | 3-strike false positive | Low | High | Admin can override; manual unfreeze allowed once |

---

## 23. ADRs Index

| ID | Title | Status |
|----|-------|--------|
| [ADR-001](adr/001_why_valkey_over_redis.md) | Using Valkey over Redis | Accepted |
| [ADR-002](adr/002_why_modular_monolith.md) | Choosing Modular Monolith over Microservices | Accepted |
| [ADR-003](adr/003_why_drizzle_orm.md) | Choosing Drizzle ORM over Prisma | Accepted |
| [ADR-004](adr/004_why_nextauth.md) | Choosing NextAuth v4 over Custom JWT | Accepted |
| [ADR-005](adr/005_websocket_vs_sse.md) | WebSocket vs SSE for Realtime Location | Proposed |
| [ADR-006](adr/006_react_query.md) | React Query as Client State Management | Accepted |
| [ADR-007](adr/007_postgresql_ssot.md) | PostgreSQL as Single Source of Truth | Accepted |
| [ADR-008](adr/008_uuids_vs_autoincrement.md) | UUIDs vs Auto-increment IDs | Accepted |
| [ADR-009](adr/009_bullmq.md) | BullMQ for Background Jobs | Accepted |
| [ADR-010](adr/010_zod.md) | Zod for Runtime Validation | Accepted |
| [ADR-011](adr/011_docker_strategy.md) | Docker Compose + GitHub Actions | Accepted |

---

## 24. Appendix — Diagrams Index

All diagrams are in `docs/diagrams/` and use Mermaid syntax for GitHub rendering.

| Diagram | File | Description |
|---------|------|-------------|
| System Context | `c4-l1-system-context.md` | High-level actors + Harfino system boundary |
| Container | `c4-l2-container-deployment.md` | Next.js, PostgreSQL, Valkey, Workers |
| Component | `c4-l3-component-internal.md` | Module boundaries, dependency rule |
| ERD | `erd.md` | Full database schema with indexes |
| Onboarding Flow | `data-flow-onboarding.md` | Craftsman onboarding + admin review |
| Order Lifecycle | `data-flow-order.md` | Order state transitions |
| Complaint Flow | `data-flow-complaint.md` | Complaint + 3-strike ban |
| Google OAuth | `seq-google-oauth.md` | OAuth sequence diagram |
| Realtime Location | `seq-realtime-location.md` | WebSocket + Geolocation sequence |
| Caching | `caching-strategy.md` | Valkey + React Query layers |
| Webhooks | `webhook-architecture.md` | Outgoing/incoming webhook flow |
| Deployment | `deployment-pipeline.md` | Docker Compose + CI/CD |
| Security | `security-architecture.md` | Defense-in-depth controls |
| Monitoring | `monitoring-architecture.md` | Metrics, logs, traces, alerts |
| Testing | `testing-pyramid.md` | Unit / Integration / E2E split |
| User Flows | `user-flows.md` | All role-based user journeys |
| Project Structure | `project-structure.md` | Complete file tree |

---

## Quick Reference: Commands

```bash
# Development
cp .env.example .env.local   # Configure secrets
npm install
npm run docker:dev           # Start postgres + valkey
npm run db:generate          # Drizzle generate
npm run db:migrate           # Drizzle migrate
npm run dev                  # Next.js dev server (port 3000 + 3001 WS)
npm run worker:dev           # Background workers

# Quality
npm run lint                 # ESLint + Prettier
npm run typecheck            # tsc --noEmit
npm run test:unit
npm run test:integration
npm run test:e2e

# Production
npm run build
docker build -t harfino-app .
docker compose -f docker-compose.prod.yml up -d

# Database
npm run db:studio            # Drizzle Studio (DB browser)
npm run db:seed              # Seed Arabic data
```

---

## Change Log

| Date | Version | Author | Change |
|------|---------|--------|--------|
| 2026-07-01 | 1.0.0 | Ahmed Shawky | Initial project plan |
