export interface ILocationRepository {
  upsert(userId: string, location: { latitude: string; longitude: string; isAvailable: boolean }): Promise<void>;
  getByUserId(userId: string): Promise<{ id: string; userId: string; latitude: string; longitude: string; lastUpdated: Date; isAvailable: boolean } | null>;
  getNearby(lat: number, lng: number, radiusKm: number, craftType?: string): Promise<{ userId: string; latitude: string; longitude: string }[]>;
}