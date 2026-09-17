import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValkeyCacheService } from './cache-service';
import { valkey } from '../valkey/client';

describe('CacheService', () => {
  let cacheService: ValkeyCacheService;

  beforeEach(() => {
    cacheService = new ValkeyCacheService();
    vi.clearAllMocks();
  });

  it('sets and gets a value', async () => {
    vi.spyOn(valkey, 'setex').mockResolvedValue('OK');
    vi.spyOn(valkey, 'get').mockResolvedValue(JSON.stringify('cached-value'));

    await cacheService.set('key', 'value', 60);
    const result = await cacheService.get<string>('key');

    expect(result).toBe('cached-value');
  });

  it('returns null for missing key', async () => {
    vi.spyOn(valkey, 'get').mockResolvedValue(null);

    const result = await cacheService.get<string>('missing-key');
    expect(result).toBeNull();
  });

  it('deletes a key', async () => {
    vi.spyOn(valkey, 'del').mockResolvedValue(1);
    await expect(cacheService.del('key')).resolves.toBeUndefined();
  });

  it('returns null for missing key on exists check', async () => {
    vi.spyOn(valkey, 'get').mockResolvedValue(null);
    const result = await cacheService.get<string>('missing-key');
    expect(result).toBeNull();
  });

  it('sets with TTL', async () => {
    vi.spyOn(valkey, 'setex').mockResolvedValue('OK');
    await cacheService.set('key', 'value', 60);
    expect(valkey.setex).toHaveBeenCalledWith('key', 60, JSON.stringify('value'));
  });
});
