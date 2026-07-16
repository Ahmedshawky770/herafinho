import { beforeAll, afterAll, beforeEach } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@herafino/shared/db/schema';

export interface DbTestContext {
  db: ReturnType<typeof drizzle>;
  sql: ReturnType<typeof postgres>;
}

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgres://herafino:password@localhost:5432/herafino_test';

/**
 * Detects whether a real integration database is reachable.
 * Integration suites call this to `describe.skipIf(!dbAvailable())` so the
 * suite stays green (and fast) in environments without Postgres/Valkey while
 * still running in CI where the services are provisioned.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  const probe = postgres(url, { prepare: false, max: 1, idle_timeout: 1, connect_timeout: 2 });
  try {
    await probe`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await probe.end({ timeout: 1 }).catch(() => undefined);
  }
}

let cachedAvailability: boolean | null = null;
export async function dbAvailable(): Promise<boolean> {
  if (cachedAvailability === null) {
    cachedAvailability = await isDatabaseAvailable();
  }
  return cachedAvailability;
}

export function setupIntegrationDatabase() {
  const ctx: DbTestContext = {} as DbTestContext;

  beforeAll(async () => {
    const sql = postgres(TEST_DATABASE_URL, { prepare: false });
    const db = drizzle(sql, { schema });
    ctx.sql = sql;
    ctx.db = db;
  });

  afterAll(async () => {
    if (ctx.sql) {
      await ctx.sql.end();
    }
  });

  return ctx;
}

const TABLES = [
  'notifications',
  'reviews',
  'complaints',
  'orders',
  'craftsman_locations',
  'craftsman_profiles',
  'event_outbox',
  'users',
] as const;

export async function truncateAll(db: ReturnType<typeof drizzle>) {
  for (const table of TABLES) {
    await db.execute(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
  }
}

export function withCleanDatabase(ctx: DbTestContext) {
  beforeEach(async () => {
    await truncateAll(ctx.db);
  });
}

export function randomId(prefix = 't'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Integration suites that touch a real Postgres instance are gated behind an
 * explicit opt-in. They only run when `RUN_INTEGRATION=1` is set AND a usable
 * `DATABASE_URL` is configured — which CI does. Locally they are gracefully
 * skipped so `npm run test` stays green and fast without infrastructure.
 */
export const RUN_INTEGRATION = process.env.RUN_INTEGRATION === '1' && Boolean(process.env.DATABASE_URL);

export const describeIntegration = RUN_INTEGRATION ? describe : describe.skip;
