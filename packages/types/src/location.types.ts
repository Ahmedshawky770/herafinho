import type { ID } from './user.types';

export type { ID };

export interface Location {
  id: ID;
  userId: ID;
  latitude: string;
  longitude: string;
  updatedAt: Date;
  available: boolean;
}

export interface NearbyCraftsman {
  userId: ID;
  name: string;
  craftType: string;
  latitude: string;
  longitude: string;
  distanceKm: number;
  rating: number;
  isAvailable: boolean;
}

export interface GeocodeResult {
  lat: string;
  lng: string;
  formattedAddress: string;
}
