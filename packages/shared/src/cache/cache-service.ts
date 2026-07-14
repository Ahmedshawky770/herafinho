import type { ICacheService } from '@herafino/contracts';
import { getValkeyClient } from '../valkey/client';

export class ValkeyCacheService implements ICacheService {
  private get client() {
    return getValkeyClient();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try { return JSON.parse(value) as T; } catch { return value as unknown as T; }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? 300;
    await this.client.setex(key, ttl, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];
    const values = await this.client.mget(keys);
    return values.map((value) => {
      if (value === null) return null;
      try { return JSON.parse(value) as T; } catch { return value as unknown as T; }
    });
  }

  async mset(keyValuePairs: Record<string, unknown>, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds ?? 300;
    if (ttl > 0) {
      await Promise.all(
        Object.entries(keyValuePairs).map(([key, value]) => this.client.setex(key, ttl, JSON.stringify(value)))
      );
    } else {
      await Promise.all(
        Object.entries(keyValuePairs).map(([key, value]) => this.client.set(key, JSON.stringify(value)))
      );
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(keys);
  }

  async flushAll(): Promise<void> {
    await this.client.flushall();
  }
}
