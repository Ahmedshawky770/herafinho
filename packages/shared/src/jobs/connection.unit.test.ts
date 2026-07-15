// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';

const ORIGINAL_VALKEY_URL = process.env.VALKEY_URL;
const ORIGINAL_VALKEY_PASSWORD = process.env.VALKEY_PASSWORD;

afterEach(() => {
  process.env.VALKEY_URL = ORIGINAL_VALKEY_URL;
  process.env.VALKEY_PASSWORD = ORIGINAL_VALKEY_PASSWORD;
});

describe('getQueueConnection', () => {
  it('parses host and port from VALKEY_URL', async () => {
    process.env.VALKEY_URL = 'valkey://valkey:6379';
    const { getQueueConnection } = await import('./connection');
    const conn = getQueueConnection();
    expect(conn.host).toBe('valkey');
    expect(conn.port).toBe(6379);
  });

  it('forwards the password when present in VALKEY_URL', async () => {
    process.env.VALKEY_URL = 'valkey://:secret@valkey:6379';
    const { getQueueConnection } = await import('./connection');
    const conn = getQueueConnection();
    expect(conn.password).toBe('secret');
  });

  it('falls back to localhost when VALKEY_URL is missing', async () => {
    delete process.env.VALKEY_URL;
    const { getQueueConnection } = await import('./connection');
    const conn = getQueueConnection();
    expect(conn.host).toBe('localhost');
    expect(conn.port).toBe(6379);
  });
});
