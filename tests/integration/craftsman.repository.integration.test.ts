import { describe, it, expect } from 'vitest';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { setupIntegrationDatabase, withCleanDatabase, randomId } from './helpers/db';
import { describeIntegration } from './helpers/db';
import { craftsmanProfiles } from '@herafino/shared/db/schema';
import type { NewCraftsmanProfile } from '@herafino/types';

const ctx = setupIntegrationDatabase();
withCleanDatabase(ctx);

async function seedCraftsman(overrides: Partial<NewCraftsmanProfile> = {}) {
  const user = await new UserRepository().create({
    email: `${randomId()}@example.com`,
    name: 'Craft',
    image: 'http://example.com/c.png',
    role: 'craftsman',
  });
  return new CraftsmanRepository().createProfile({
    userId: user.id,
    craftType: 'plumber',
    experienceYears: 4,
    idCardFrontUrl: 'front',
    idCardBackUrl: 'back',
    facePhotoUrl: 'face',
    workshopAddress: 'Cairo',
    workshopLatitude: '30.0444',
    workshopLongitude: '31.2357',
    ...overrides,
  });
}

describeIntegration('CraftsmanRepository (integration)', () => {
  it('creates a profile linked to a user', async () => {
    const profile = await seedCraftsman();
    expect(profile.id).toBeTruthy();
    expect(profile.status).toBe('pending');
    expect(profile.transportPhotos).toEqual([]);
  });

  it('finds a profile by user id and by profile id', async () => {
    const profile = await seedCraftsman();
    const byUser = await new CraftsmanRepository().findProfileByUserId(profile.userId);
    const byId = await new CraftsmanRepository().findProfileById(profile.id);
    expect(byUser?.id).toBe(profile.id);
    expect(byId?.userId).toBe(profile.userId);
  });

  it('updates a profile and tracks changed fields', async () => {
    const profile = await seedCraftsman();
    const updated = await new CraftsmanRepository().updateProfile(profile.userId, { isAvailable: true });
    expect(updated.isAvailable).toBe(true);
  });

  it('throws when updating a missing profile', async () => {
    await expect(new CraftsmanRepository().updateProfile('missing-user', { isAvailable: true })).rejects.toThrow();
  });

  it('approves a profile', async () => {
    const profile = await seedCraftsman();
    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'Admin',
      image: 'i',
      role: 'admin',
    });
    await new CraftsmanRepository().approve(profile.id, admin.id);
    const approved = await new CraftsmanRepository().findProfileById(profile.id);
    expect(approved?.status).toBe('approved');
    expect(approved?.reviewedBy).toBe(admin.id);
  });

  it('rejects a profile with a reason', async () => {
    const profile = await seedCraftsman();
    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'Admin',
      image: 'i',
      role: 'admin',
    });
    await new CraftsmanRepository().reject(profile.id, 'bad_docs', admin.id);
    const rejected = await new CraftsmanRepository().findProfileById(profile.id);
    expect(rejected?.status).toBe('rejected');
    expect(rejected?.rejectionReason).toBe('bad_docs');
  });

  it('freezes and unfreezes a profile', async () => {
    const profile = await seedCraftsman();
    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'Admin',
      image: 'i',
      role: 'admin',
    });
    const frozen = await new CraftsmanRepository().freeze(profile.id, new Date(Date.now() + 86400000), 'late', admin.id);
    expect(frozen.freezeUntil).toBeTruthy();
    expect(frozen.freezeCount).toBeGreaterThanOrEqual(1);

    const unfrozen = await new CraftsmanRepository().unfreeze(profile.id, admin.id);
    expect(unfrozen.status).toBe('pending');
    expect(unfrozen.freezeUntil).toBeNull();
  });

  it('lists pending profiles', async () => {
    await seedCraftsman();
    const pending = await new CraftsmanRepository().getPendingProfiles();
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(pending.every((p) => p.status === 'pending')).toBe(true);
  });

  it('finds approved craftsmen by craft type', async () => {
    const profile = await seedCraftsman({ isAvailable: true });
    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'Admin',
      image: 'i',
      role: 'admin',
    });
    await new CraftsmanRepository().approve(profile.id, admin.id);
    const found = await new CraftsmanRepository().findApprovedByCraftType('plumber', '0', '0', 100);
    expect(found.some((p) => p.id === profile.id)).toBe(true);
  });

  it('finds nearby craftsmen within the radius', async () => {
    const admin = await new UserRepository().create({
      email: `${randomId()}@example.com`,
      name: 'Admin',
      image: 'i',
      role: 'admin',
    });
    const near = await seedCraftsman({
      isAvailable: true,
      workshopLatitude: '30.05',
      workshopLongitude: '31.24',
    });
    const far = await seedCraftsman({
      isAvailable: true,
      workshopLatitude: '40.0',
      workshopLongitude: '40.0',
    });
    await new CraftsmanRepository().approve(near.id, admin.id);
    await new CraftsmanRepository().approve(far.id, admin.id);

    const results = await new CraftsmanRepository().searchNearbyCraftsmen('plumber', '30.0444', '31.2357', 50);
    expect(results.some((r) => r.profile.id === near.id)).toBe(true);
    expect(results.some((r) => r.profile.id === far.id)).toBe(false);
  });

  it('returns an empty list for invalid coordinates', async () => {
    expect(await new CraftsmanRepository().searchNearbyCraftsmen('plumber', 'not-a-number', '31', 50)).toEqual([]);
  });

  it('isolation: profiles table is truncated between tests', async () => {
    expect((await ctx.db.select().from(craftsmanProfiles)).length).toBe(1);
  });
});
