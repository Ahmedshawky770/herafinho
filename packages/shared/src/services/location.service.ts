import type { Location } from '@herafino/types';
import { logger } from '../logger/factory';
import { db } from '../db';
import { craftsmanLocations } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { ILocationService } from '@herafino/contracts';

export class LocationService implements ILocationService {
  async getGeocode(address: string): Promise<{ lat: string; lng: string; formattedAddress: string }> {
    throw new Error('Geocoding requires Google Maps API integration — not yet configured');
  }

  async updateCraftsmanLocation(
    userId: string,
    lat: string,
    lng: string,
    available: boolean
  ): Promise<void> {
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
    } else {
      await db.insert(craftsmanLocations).values({
        userId,
        latitude: lat,
        longitude: lng,
        isAvailable: available,
      });
    }
    logger.info({ userId, lat, lng, available }, 'Craftsman location updated');
  }

  async getNearbyCraftsmen(
    lat: string,
    lng: string,
    craftType: string,
    radiusKm: number
  ): Promise<Array<{ userId: string; name: string; craftType: string; latitude: string; longitude: string; distanceKm: number; rating: number; isAvailable: boolean }>> {
    throw new Error('Spatial querying via haversine is implemented in CraftsmanRepository.searchNearbyCraftsmen — use that instead');
  }

  subscribeToLocationUpdates(
    userId: string,
    callback: (location: Location) => void
  ): () => void {
    logger.warn({ userId }, 'subscribeToLocationUpdates is a placeholder — WebSocket-based subscription not yet wired');
    return () => {};
  }
}
