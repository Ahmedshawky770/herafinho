import { eq } from 'drizzle-orm';
import { db } from '../db';
import { craftsmanLocations } from '../db/schema';
export class LocationRepository {
    async upsert(userId, location) {
        await db
            .insert(craftsmanLocations)
            .values({
            ...location,
            userId,
        })
            .onConflictDoUpdate({
            target: craftsmanLocations.userId,
            set: {
                latitude: location.latitude,
                longitude: location.longitude,
                isAvailable: location.isAvailable,
                lastUpdated: new Date(),
            },
        });
    }
    async getByUserId(userId) {
        const result = await db.query.craftsmanLocations.findFirst({
            where: eq(craftsmanLocations.userId, userId),
        });
        return result ?? null;
    }
    async getNearby(lat, lng, radiusKm, craftType) {
        const where = craftType
            ? eq(craftsmanLocations.userId, craftType)
            : undefined;
        const results = await db.query.craftsmanLocations.findMany({
            where,
        });
        return results.filter((loc) => loc.isAvailable).map(({ userId, latitude, longitude }) => ({ userId, latitude, longitude }));
    }
}
