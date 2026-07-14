import { describe, it, expect } from 'vitest';
import { CACHE_KEYS } from '@herafino/shared/cache/cache-keys';

describe('CACHE_KEYS factory', () => {
  it('returns a stable craftsman profile key', () => {
    expect(CACHE_KEYS.CRAFTSMAN_PROFILE('abc-123')).toBe('craftsman:profile:abc-123');
  });

  it('returns a deterministic search key', () => {
    const params = { craftType: 'plumber', city: 'cairo' } as Record<string, string>;
    expect(CACHE_KEYS.SEARCH_RESULTS(params)).toBe('search:{"craftType":"plumber","city":"cairo"}');
  });

  it('returns unique keys per caller', () => {
    expect(CACHE_KEYS.ORDER('order-1')).not.toBe(CACHE_KEYS.ORDER('order-2'));
  });
});
