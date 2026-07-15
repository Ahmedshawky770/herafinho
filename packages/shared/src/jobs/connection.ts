import type { ConnectionOptions } from 'bullmq';

/**
 * Resolves a BullMQ connection from VALKEY_URL (the same source the rest of the
 * monorepo uses), keeping worker/producer connection config in a single place.
 */
export function getQueueConnection(): ConnectionOptions {
  const url = process.env.VALKEY_URL ?? 'valkey://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || process.env.VALKEY_PASSWORD,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      password: process.env.VALKEY_PASSWORD,
    };
  }
}
