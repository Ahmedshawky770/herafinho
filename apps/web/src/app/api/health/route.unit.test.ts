import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/logger/factory', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock('@herafino/shared/valkey/client', () => ({
  getValkeyClient: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue('PONG'),
  })),
}));

vi.mock('@herafino/shared/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 'user-1' }]),
      }),
    }),
  },
}));

vi.mock('@herafino/shared/db/schema', () => ({
  users: {},
}));

import { GET } from './route';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return healthy status when all checks pass', async () => {
    const response = await GET();
    const data = await (response as Response).json();
    expect(data.status).toBe('healthy');
    expect(data.checks.database.healthy).toBe(true);
    expect(data.checks.valkey.healthy).toBe(true);
  });

  it('should return 200 when healthy', async () => {
    const response = await GET();
    expect((response as Response).status).toBe(200);
  });

  it('should include timestamp', async () => {
    const response = await GET();
    const data = await (response as Response).json();
    expect(data.timestamp).toBeDefined();
    expect(new Date(data.timestamp).getTime()).not.toBeNaN();
  });

  it('should include Cache-Control no-store header', async () => {
    const response = await GET();
    expect((response as Response).headers.get('Cache-Control')).toBe('no-store');
  });

  it('should return degraded when database fails', async () => {
    const { db } = await import('@herafino/shared/db');
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        limit: vi.fn().mockRejectedValue(new Error('DB connection failed')),
      }),
    });

    const response = await GET();
    const data = await (response as Response).json();
    expect(data.status).toBe('degraded');
    expect(data.checks.database.healthy).toBe(false);
    expect((response as Response).status).toBe(503);
  });

  it('should return degraded when valkey fails', async () => {
    const { getValkeyClient } = await import('@herafino/shared/valkey/client');
    (getValkeyClient as ReturnType<typeof vi.fn>).mockReturnValue({
      ping: vi.fn().mockRejectedValue(new Error('Valkey connection failed')),
    });

    const response = await GET();
    const data = await (response as Response).json();
    expect(data.status).toBe('degraded');
    expect(data.checks.valkey.healthy).toBe(false);
  });

  it('should return unhealthy on unexpected error', async () => {
    const originalObjectValues = Object.values;
    (Object as any).values = () => {
      throw new Error('Unexpected');
    };

    const response = await GET();
    const data = await (response as Response).json();
    expect(data.status).toBe('unhealthy');
    expect((response as Response).status).toBe(500);

    (Object as any).values = originalObjectValues;
  });
});
