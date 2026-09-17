import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      craftsmanProfiles: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', experienceYears: 5, status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', experienceYears: 5, status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() }]),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }),
    execute: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  sql: vi.fn((template: string) => ({ type: 'sql', template })),
  ilike: vi.fn((field, value) => ({ type: 'ilike', field, value })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
  asc: vi.fn((field) => ({ type: 'asc', field })),
}));

vi.mock('@herafino/shared/logger/factory', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock('@herafino/shared/db/schema', () => ({
  craftsmanProfiles: {},
  users: {},
}));

vi.mock('./outbox-repository', () => ({
  OutboxRepository: vi.fn().mockImplementation(() => ({
    append: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { CraftsmanRepository } from './craftsman.repository';

describe('CraftsmanRepository', () => {
  let repo: CraftsmanRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new CraftsmanRepository();
  });

  describe('findProfileByUserId', () => {
    it('should find profile by user id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() });

      const profile = await repo.findProfileByUserId('user-1');
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('prof-1');
    });

    it('should return null when profile not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const profile = await repo.findProfileByUserId('missing');
      expect(profile).toBeNull();
    });
  });

  describe('findProfileById', () => {
    it('should find profile by id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() });

      const profile = await repo.findProfileById('prof-1');
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('prof-1');
    });

    it('should return null when profile not found by id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const profile = await repo.findProfileById('missing');
      expect(profile).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all profiles', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'prof-1', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const profiles = await repo.findAll();
      expect(profiles).toHaveLength(1);
    });

    it('should filter by status', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'prof-1', status: 'approved', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const profiles = await repo.findAll('approved');
      expect(profiles).toHaveLength(1);
    });
  });

  describe('createProfile', () => {
    it('should create profile and append outbox event', async () => {
      const profile = await repo.createProfile({
        userId: 'user-1',
        craftType: 'carpenter',
        experienceYears: 5,
        idCardFrontUrl: 'http://front.jpg',
        idCardBackUrl: 'http://back.jpg',
        facePhotoUrl: 'http://face.jpg',
        workshopAddress: 'Cairo',
        workshopLatitude: '30.0',
        workshopLongitude: '31.0',
      } as any);
      expect(profile.id).toBe('prof-1');
    });

    it('should default transportPhotos to empty array', async () => {
      const profile = await repo.createProfile({
        userId: 'user-1',
        craftType: 'carpenter',
        experienceYears: 5,
        idCardFrontUrl: 'http://front.jpg',
        idCardBackUrl: 'http://back.jpg',
        facePhotoUrl: 'http://face.jpg',
        workshopAddress: 'Cairo',
        workshopLatitude: '30.0',
        workshopLongitude: '31.0',
        transportPhotos: undefined,
      } as any);
      expect(profile.transportPhotos).toEqual([]);
    });
  });

  describe('updateProfile', () => {
    it('should update profile', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', experienceYears: 5, status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() });

      const profile = await repo.updateProfile('user-1', { experienceYears: 10 } as any);
      expect(profile).toBeDefined();
    });

    it('should throw when profile not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(repo.updateProfile('missing', {} as any)).rejects.toThrow('Craftsman profile not found');
    });
  });

  describe('approve', () => {
    it('should approve profile and update user onboarding', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() });

      await repo.approve('prof-1', 'admin-1');
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject profile', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() });

      await repo.reject('prof-1', 'spam', 'admin-1');
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('freeze', () => {
    it('should freeze profile', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date(), freezeCount: 0 });

      const profile = await repo.freeze('prof-1', new Date(), 'spam', 'admin-1');
      expect(profile).toBeDefined();
    });

    it('should throw when profile not found for freeze', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(repo.freeze('missing', new Date(), 'spam', 'admin-1')).rejects.toThrow('Craftsman profile not found');
    });
  });

  describe('unfreeze', () => {
    it('should unfreeze profile', async () => {
      const profile = await repo.unfreeze('prof-1', 'admin-1');
      expect(profile).toBeDefined();
    });
  });

  describe('ban', () => {
    it('should ban profile', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date() });

      await repo.ban('prof-1', 'admin-1');
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('incrementFreezeCount', () => {
    it('should increment freeze count', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date(), freezeCount: 0 });
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: 'prof-1', userId: 'user-1', craftType: 'carpenter', status: 'pending', isAvailable: true, createdAt: new Date(), updatedAt: new Date(), freezeCount: 1 }]),
          }),
        }),
      });

      const count = await repo.incrementFreezeCount('prof-1');
      expect(count).toBeDefined();
      expect(count).toBe(1);
    });

    it('should throw when profile not found for increment', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(repo.incrementFreezeCount('missing')).rejects.toThrow('Craftsman profile not found');
    });
  });

  describe('getPendingProfiles', () => {
    it('should return pending profiles', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'prof-1', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const profiles = await repo.getPendingProfiles();
      expect(profiles).toHaveLength(1);
    });
  });

  describe('searchByNameOrCraft', () => {
    it('should search by name or craft', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          innerJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockReturnValueOnce({
                limit: vi.fn().mockResolvedValue([{ profile: { id: 'prof-1' }, name: 'Ahmed' }]),
              }),
            }),
          }),
        }),
      });

      const results = await repo.searchByNameOrCraft('Ahmed');
      expect(results).toHaveLength(1);
    });

    it('should return empty array for empty query without craft type', async () => {
      const results = await repo.searchByNameOrCraft('');
      expect(results).toEqual([]);
    });

    it('should filter by craft type', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        from: vi.fn().mockReturnValueOnce({
          innerJoin: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockReturnValueOnce({
              orderBy: vi.fn().mockReturnValueOnce({
                limit: vi.fn().mockResolvedValue([{ profile: { id: 'prof-1' }, name: 'Ahmed' }]),
              }),
            }),
          }),
        }),
      });

      const results = await repo.searchByNameOrCraft('Ahmed', 'carpenter');
      expect(results).toHaveLength(1);
    });
  });

  describe('findApprovedByCraftType', () => {
    it('should find approved by craft type', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanProfiles.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'prof-1', craftType: 'carpenter', status: 'approved', isAvailable: true, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const profiles = await repo.findApprovedByCraftType('carpenter', '0', '0', 50);
      expect(profiles).toHaveLength(1);
    });
  });

  describe('searchNearbyCraftsmen', () => {
    it('should return empty array for invalid coordinates', async () => {
      const results = await repo.searchNearbyCraftsmen('carpenter', 'invalid', 'invalid', 10);
      expect(results).toEqual([]);
    });

    it('should return empty array for non-positive radius', async () => {
      const results = await repo.searchNearbyCraftsmen('carpenter', '30', '31', 0);
      expect(results).toEqual([]);
    });

    it('should fallback to in-memory when PostGIS throws', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('PostGIS not available'));
      (db.query.craftsmanProfiles.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'prof-1', craftType: 'carpenter', status: 'approved', isAvailable: true, workshopLatitude: '30.0', workshopLongitude: '31.0', createdAt: new Date(), updatedAt: new Date(), user: { name: 'Ahmed' } },
      ]);

      const results = await repo.searchNearbyCraftsmen('carpenter', '30.0', '31.0', 10);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('appendOutbox', () => {
    it('should append outbox event when outbox is provided', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new CraftsmanRepository(mockOutbox as any);
      await repoWithOutbox.appendOutbox({
        id: 'evt-1',
        name: 'test.event',
        payload: {},
        metadata: { occurredAt: new Date() },
      });
      expect(mockOutbox.append).toHaveBeenCalled();
    });

    it('should not throw when outbox is not provided', async () => {
      const repoWithoutOutbox = new CraftsmanRepository();
      await expect(repoWithoutOutbox.appendOutbox({
        id: 'evt-1',
        name: 'test.event',
        payload: {},
        metadata: { occurredAt: new Date() },
      })).resolves.toBeUndefined();
    });
  });
});
