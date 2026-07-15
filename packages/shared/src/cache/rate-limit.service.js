import { ValkeyCacheService } from './cache-service';
export class RateLimitService {
    cache;
    constructor(cache) {
        this.cache = cache;
    }
    async check(key, config) {
        const windowKey = `rate_limit:${key}`;
        const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
        const current = await this.cache.get(windowKey);
        const count = (current ?? 0) + 1;
        if (count > config.maxRequests) {
            return { allowed: false, remaining: 0, resetAt: windowStart + config.windowMs };
        }
        await this.cache.set(windowKey, count, Math.floor((config.windowMs - (Date.now() % config.windowMs)) / 1000));
        return { allowed: true, remaining: config.maxRequests - count, resetAt: windowStart + config.windowMs };
    }
}
export const rateLimitService = new RateLimitService(new ValkeyCacheService());
