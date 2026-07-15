import { logger } from '../logger/factory';
import { db } from '../db';
import { craftsmanLocations } from '../db/schema';
import { eq } from 'drizzle-orm';
export class LocationService {
    async getGeocode(address) {
        throw new Error('Geocoding requires Google Maps API integration — not yet configured');
    }
    async updateCraftsmanLocation(userId, lat, lng, available) {
        const existing = await db.query.craftsmanLocations.findFirst({
            where: eq(craftsmanLocations.userId, userId),
        });
        if (existing) {
            await db.update(craftsmanLocations).set({
                latitude: lat,
                longitude: lng,
                isAvailable: available,
                lastUpdated: new Date(),
            }).where(eq(craftsmanLocations.userId, userId));
        }
        else {
            await db.insert(craftsmanLocations).values({
                userId,
                latitude: lat,
                longitude: lng,
                isAvailable: available,
            });
        }
        logger.info({ userId, lat, lng, available }, 'Craftsman location updated');
    }
    async getNearbyCraftsmen(lat, lng, craftType, radiusKm) {
        throw new Error('Spatial querying via haversine is implemented in CraftsmanRepository.searchNearbyCraftsmen — use that instead');
    }
    subscribeToLocationUpdates(userId, callback) {
        logger.warn({ userId }, 'subscribeToLocationUpdates is a placeholder — WebSocket-based subscription not yet wired');
        return () => { };
    }
}
