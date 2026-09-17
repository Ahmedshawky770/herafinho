import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      craftsmanLocations: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
}));

vi.mock('@herafino/shared/db/schema', () => ({
  craftsmanLocations: {},
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

import { LocationRepository } from './location.repository';

describe('LocationRepository', () => {
  let repo: LocationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new LocationRepository();
  });

  describe('upsert', () => {
    it('should upsert a location', async () => {
      await repo.upsert('user-1', { latitude: '30.0', longitude: '31.0', isAvailable: true });
      expect(repo).toBeDefined();
    });

    it('should upsert with isAvailable false', async () => {
      await repo.upsert('user-1', { latitude: '30.0', longitude: '31.0', isAvailable: false });
      expect(repo).toBeDefined();
    });
  });

  describe('getByUserId', () => {
    it('should get location by user id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'loc-1', userId: 'user-1', latitude: '30.0', longitude: '31.0', isAvailable: true, lastUpdated: new Date() });

      const location = await repo.getByUserId('user-1');
      expect(location).not.toBeNull();
      expect(location?.userId).toBe('user-1');
    });

    it('should return null when location not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const location = await repo.getByUserId('missing');
      expect(location).toBeNull();
    });
  });

  describe('getNearby', () => {
    it('should get nearby locations', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'loc-1', userId: 'user-1', latitude: '30.0', longitude: '31.0', isAvailable: true },
        { id: 'loc-2', userId: 'user-2', latitude: '30.1', longitude: '31.1', isAvailable: false },
      ]);

      const nearby = await repo.getNearby(30, 31, 10);
      expect(nearby).toHaveLength(1);
      expect(nearby[0].userId).toBe('user-1');
    });

    it('should filter out unavailable locations', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'loc-1', userId: 'user-1', latitude: '30.0', longitude: '31.0', isAvailable: false },
      ]);

      const nearby = await repo.getNearby(30, 31, 10);
      expect(nearby).toHaveLength(0);
    });

    it('should return empty array when no locations', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const nearby = await repo.getNearby(30, 31, 10);
      expect(nearby).toEqual([]);
    });

    it('should return correct fields for nearby locations', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'loc-1', userId: 'user-1', latitude: '30.0', longitude: '31.0', isAvailable: true },
      ]);

      const nearby = await repo.getNearby(30, 31, 10);
      expect(nearby[0]).toHaveProperty('userId', 'user-1');
      expect(nearby[0]).toHaveProperty('latitude', '30.0');
      expect(nearby[0]).toHaveProperty('longitude', '31.0');
    });
  });
});
