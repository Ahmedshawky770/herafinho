import type { ID, CraftsmanProfile, NewCraftsmanProfile } from '@herafino/types';

export interface ICraftsmanRepository {
  findProfileByUserId(userId: ID): Promise<CraftsmanProfile | null>;
  findProfileById(id: ID): Promise<CraftsmanProfile | null>;
  createProfile(profile: NewCraftsmanProfile): Promise<CraftsmanProfile>;
  updateProfile(userId: ID, data: Partial<CraftsmanProfile>): Promise<CraftsmanProfile>;
  approve(id: ID, adminId: ID): Promise<void>;
  reject(id: ID, reason: string, adminId: ID): Promise<void>;
  freeze(id: ID, until: Date, reason: string, adminId: ID): Promise<CraftsmanProfile>;
  unfreeze(id: ID, adminId: ID): Promise<CraftsmanProfile>;
  ban(id: ID, adminId: ID): Promise<void>;
  incrementFreezeCount(id: ID): Promise<number>;
  getPendingProfiles(): Promise<CraftsmanProfile[]>;
  findApprovedByCraftType(
    craftType: string,
    lat: string,
    lng: string,
    radiusKm: number
  ): Promise<CraftsmanProfile[]>;
}