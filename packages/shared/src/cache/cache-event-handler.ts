import type { EventHandler } from '@herafino/contracts';
import { ValkeyCacheService } from './cache-service';
import { getInvalidationPatterns } from './cache-invalidation';

const cacheService = new ValkeyCacheService();

export async function invalidateCacheOnEvent(eventName: string): Promise<void> {
  const patterns = getInvalidationPatterns(eventName);
  for (const pattern of patterns) {
    await cacheService.invalidatePattern(pattern);
  }
}

export class CacheInvalidationEventHandler implements EventHandler {
  async handle(event: { name: string; payload: Record<string, unknown> }): Promise<void> {
    await invalidateCacheOnEvent(event.name);
  }
}
