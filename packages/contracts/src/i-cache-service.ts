export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset(keyValuePairs: Record<string, unknown>, ttlSeconds?: number): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
}