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
