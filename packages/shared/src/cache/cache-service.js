import { getValkeyClient } from '../valkey/client';
export class ValkeyCacheService {
    get client() {
        return getValkeyClient();
    }
    async get(key) {
        const value = await this.client.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    async set(key, value, ttlSeconds) {
        const ttl = ttlSeconds ?? 300;
        await this.client.setex(key, ttl, JSON.stringify(value));
    }
    async del(key) {
        await this.client.del(key);
    }
    async mget(keys) {
        if (keys.length === 0)
            return [];
        const values = await this.client.mget(keys);
        return values.map((value) => {
            if (value === null)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        });
    }
    async mset(keyValuePairs, ttlSeconds) {
        const ttl = ttlSeconds ?? 300;
        if (ttl > 0) {
            await Promise.all(Object.entries(keyValuePairs).map(([key, value]) => this.client.setex(key, ttl, JSON.stringify(value))));
        }
        else {
            await Promise.all(Object.entries(keyValuePairs).map(([key, value]) => this.client.set(key, JSON.stringify(value))));
        }
    }
    async invalidatePattern(pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0)
            await this.client.del(keys);
    }
    async flushAll() {
        await this.client.flushall();
    }
}
