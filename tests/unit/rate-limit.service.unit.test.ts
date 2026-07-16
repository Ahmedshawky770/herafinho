import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimitService, type RateLimitConfig } from '@herafino/shared/cache/rate-limit.service';
import type { ICacheService } from '@herafino/contracts';

vi.mock('iovalkey', () => ({
  Redis: class {
    constructor(_options?: unknown) {}
    on() {
      return this;
    }
    connect() {
      return Promise.resolve();
    }
  },
}));

class FakeCache implements ICacheService {
  private store = new Map<string, number>();
  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as unknown as T) ?? null;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value as unknown as number);
  }
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
  async mget<T>(_keys: string[]): Promise<(T | null)[]> {
    return [];
  }
  async mset(_pairs: Record<string, unknown>): Promise<void> {}
  async invalidatePattern(_pattern: string): Promise<void> {}
}

const config: RateLimitConfig = { windowMs: 60_000, maxRequests: 3 };

describe('RateLimitService', () => {
  let cache: FakeCache;
  let service: RateLimitService;

  beforeEach(() => {
    cache = new FakeCache();
    service = new RateLimitService(cache);
  });

  it('allows requests up to the limit and counts them', async () => {
    const r1 = await service.check('ip:1', config);
    const r2 = await service.check('ip:1', config);
    const r3 = await service.check('ip:1', config);

    expect(r1).toMatchObject({ allowed: true, remaining: 2 });
    expect(r2).toMatchObject({ allowed: true, remaining: 1 });
    expect(r3).toMatchObject({ allowed: true, remaining: 0 });
  });

  it('blocks requests once the limit is exceeded', async () => {
    await service.check('ip:2', config);
    await service.check('ip:2', config);
    await service.check('ip:2', config);
    const blocked = await service.check('ip:2', config);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('isolates counters per key', async () => {
    await service.check('ip:a', config);
    await service.check('ip:a', config);
    await service.check('ip:a', config);
    const other = await service.check('ip:b', config);

    expect(other.allowed).toBe(true);
    expect(other.remaining).toBe(2);
  });
});
