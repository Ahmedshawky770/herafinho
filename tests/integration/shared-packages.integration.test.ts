import { describe, it, expect } from 'vitest';

describe('Shared package runtime exports', () => {
  it('exports cache keys object', async () => {
    const mod = await import('@herafino/shared/cache/cache-keys');
    expect(mod.CACHE_KEYS).toBeDefined();
    expect(typeof mod.CACHE_KEYS).toBe('object');
    expect(typeof mod.CACHE_KEYS.CRAFTSMAN_PROFILE).toBe('function');
    expect(mod.CACHE_KEYS.CRAFTSMAN_PROFILE('1')).toBe('craftsman:profile:1');
  });

  it('exports logger factory', async () => {
    const mod = await import('@herafino/shared/logger/factory');
    expect(mod).toBeDefined();
    expect(typeof mod).toBe('object');
  });

  it('exports cache invalidation module', async () => {
    const mod = await import('@herafino/shared/cache/cache-invalidation');
    expect(mod).toBeDefined();
  });
});
