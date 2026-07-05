import type {
  User,
  UserRole,
  NewUser,
  ID,
  CraftType,
  TransportType,
  CraftsmanStatus,
} from './user.types';

export type {
  User,
  UserRole,
  NewUser,
  ID,
  CraftType,
  TransportType,
  CraftsmanStatus,
};

export interface CraftsmanProfile {
  id: ID;
  userId: ID;
  craftType: CraftType;
  experienceYears: number;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  facePhotoUrl: string;
  transportType: TransportType;
  transportPhotos: string[];
  vehicleNumber?: string;
  workshopAddress: string;
  workshopLatitude: string;
  workshopLongitude: string;
  isAvailable: boolean;
  isOnline: boolean;
  status: CraftsmanStatus;
  freezeUntil?: Date;
  freezeReason?: string;
  freezeCount: number;
  rejectionReason?: string;
  reviewedBy?: ID;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCraftsmanProfile {
  userId: ID;
  craftType: CraftType;
  experienceYears: number;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  facePhotoUrl: string;
  transportType: TransportType;
  transportPhotos: string[];
  vehicleNumber?: string;
  workshopAddress: string;
  workshopLatitude: string;
  workshopLongitude: string;
}

export interface CraftsmanLocation {
  id: ID;
  userId: ID;
  latitude: string;
  longitude: string;
  lastUpdated: Date;
  isAvailable: boolean;
}
