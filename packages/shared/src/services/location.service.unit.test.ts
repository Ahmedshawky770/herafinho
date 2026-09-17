import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCraftsmanSearchNearby = vi.fn();

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      craftsmanLocations: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'loc-1', userId: 'user-1', latitude: '30.0', longitude: '31.0', isAvailable: true, lastUpdated: new Date() }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
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
  craftsmanLocations: {},
}));

vi.mock('@herafino/shared/valkey/client', () => ({
  valkey: {
    duplicate: vi.fn(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      quit: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    })),
  },
}));

vi.mock('../repositories/craftsman.repository', () => ({
  CraftsmanRepository: vi.fn().mockImplementation(function() {
    return {
      searchNearbyCraftsmen: mockCraftsmanSearchNearby,
    };
  }),
}));

import { LocationService } from './location.service';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCraftsmanSearchNearby.mockReset();
    service = new LocationService();
  });

  describe('getGeocode', () => {
    it('should throw when GOOGLE_MAPS_SERVER_KEY is not set', async () => {
      delete process.env.GOOGLE_MAPS_SERVER_KEY;
      await expect(service.getGeocode('Cairo')).rejects.toThrow('Geocoding is not configured');
    });

    it('should throw when geocoding returns no results', async () => {
      process.env.GOOGLE_MAPS_SERVER_KEY = 'test-key';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
      });

      await expect(service.getGeocode('InvalidAddress12345')).rejects.toThrow();
    });
  });

  describe('updateCraftsmanLocation', () => {
    it('should update existing craftsman location', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'loc-1' });

      await service.updateCraftsmanLocation('user-1', '30.0', '31.0', true);
      expect(db.update).toHaveBeenCalled();
    });

    it('should insert new craftsman location', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await service.updateCraftsmanLocation('user-1', '30.0', '31.0', false);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should log location update', async () => {
      const { logger } = await import('@herafino/shared/logger/factory');
      const { db } = await import('@herafino/shared/db');
      (db.query.craftsmanLocations.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'loc-1' });

      await service.updateCraftsmanLocation('user-1', '30.0', '31.0', true);
      expect(logger.info).toHaveBeenCalledWith({ userId: 'user-1', lat: '30.0', lng: '31.0', available: true }, 'Craftsman location updated');
    });
  });

  describe('getNearbyCraftsmen', () => {
    it('should search nearby craftsmen', async () => {
      mockCraftsmanSearchNearby.mockResolvedValue([
        { profile: { userId: 'user-1', craftType: 'carpenter', workshopLatitude: '30.0', workshopLongitude: '31.0', isAvailable: true } as any, distanceKm: 5, name: 'Craftsman 1' },
      ]);

      const results = await service.getNearbyCraftsmen('30.0', '31.0', 'carpenter', 10);
      expect(results).toHaveLength(1);
      expect(results[0].userId).toBe('user-1');
    });

    it('should map results correctly', async () => {
      mockCraftsmanSearchNearby.mockResolvedValue([
        { profile: { userId: 'user-1', craftType: 'carpenter', workshopLatitude: '30.0', workshopLongitude: '31.0', isAvailable: true } as any, distanceKm: 5, name: 'Craftsman 1' },
      ]);

      const results = await service.getNearbyCraftsmen('30.0', '31.0', 'carpenter', 10);
      expect(results[0].rating).toBe(0);
      expect(results[0].craftType).toBe('carpenter');
      expect(results[0].distanceKm).toBe(5);
    });
  });

  describe('subscribeToLocationUpdates', () => {
    it('should subscribe and return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToLocationUpdates('user-1', callback);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call valkey.duplicate on subscribe', async () => {
      const callback = vi.fn();
      service.subscribeToLocationUpdates('user-1', callback);
      const { valkey } = await import('@herafino/shared/valkey/client');
      expect(valkey.duplicate).toHaveBeenCalled();
    });

    it('should return unsubscribe function that cleans up', async () => {
      const callback = vi.fn();
      const unsubscribe = service.subscribeToLocationUpdates('user-1', callback);
      expect(typeof unsubscribe).toBe('function');
      const result = unsubscribe();
      expect(result).toBeUndefined();
    });
  });
});
