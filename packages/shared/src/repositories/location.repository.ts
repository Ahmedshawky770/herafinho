import { eq } from 'drizzle-orm';
import { db } from '../db';
import { craftsmanLocations } from '../db/schema';
import type { ID, CraftsmanLocation } from '@herafino/types';
import type { ILocationRepository } from '@herafino/contracts';

export class LocationRepository implements ILocationRepository {
   async upsert(userId: string, location: { latitude: string; longitude: string; isAvailable: boolean }): Promise<void> {
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

   async getByUserId(userId: string): Promise<{ id: string; userId: string; latitude: string; longitude: string; lastUpdated: Date; isAvailable: boolean } | null> {
     const result = await db.query.craftsmanLocations.findFirst({
       where: eq(craftsmanLocations.userId, userId),
     });
     return result ?? null;
   }

  async getNearby(lat: number, lng: number, radiusKm: number, craftType?: string): Promise<{ userId: string; latitude: string; longitude: string }[]> {
    const where = craftType
      ? eq(craftsmanLocations.userId, craftType as ID)
      : undefined;
    const results = await db.query.craftsmanLocations.findMany({
      where,
    });
    return results.filter((loc) => loc.isAvailable).map(({ userId, latitude, longitude }) => ({ userId, latitude, longitude }));
  }
}