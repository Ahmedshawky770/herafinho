import type { GeocodeResult, Location, NearbyCraftsman } from '@herafino/types';

export interface ILocationService {
  getGeocode(address: string): Promise<GeocodeResult>;
  updateCraftsmanLocation(
    userId: string,
    lat: string,
    lng: string,
    available: boolean
  ): Promise<void>;
  getNearbyCraftsmen(
    lat: string,
    lng: string,
    craftType: string,
    radiusKm: number
  ): Promise<NearbyCraftsman[]>;
  subscribeToLocationUpdates(
    userId: string,
    callback: (location: Location) => void
  ): () => void;
}
