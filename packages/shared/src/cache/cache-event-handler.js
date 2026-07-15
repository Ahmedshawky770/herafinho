import { ValkeyCacheService } from './cache-service';
import { getInvalidationPatterns } from './cache-invalidation';
const cacheService = new ValkeyCacheService();
export async function invalidateCacheOnEvent(eventName) {
    const patterns = getInvalidationPatterns(eventName);
    for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
    }
}
export class CacheInvalidationEventHandler {
    async handle(event) {
        await invalidateCacheOnEvent(event.name);
    }
}
