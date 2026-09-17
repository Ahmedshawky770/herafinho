import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      reviews: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'review-1', orderId: 'order-1', craftsmanId: 'prof-1', clientId: 'user-1', rating: 5, comment: 'Great', createdAt: new Date() }]),
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
  reviews: {},
}));

vi.mock('./outbox-repository', () => ({
  OutboxRepository: vi.fn().mockImplementation(() => ({
    append: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { ReviewRepository } from './review.repository';

describe('ReviewRepository', () => {
  let repo: ReviewRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ReviewRepository();
  });

  describe('findById', () => {
    it('should find review by id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'review-1', orderId: 'order-1', craftsmanId: 'prof-1', clientId: 'user-1', rating: 5, comment: 'Great', createdAt: new Date() });

      const review = await repo.findById('review-1');
      expect(review).not.toBeNull();
      expect(review?.id).toBe('review-1');
    });

    it('should return null when review not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const review = await repo.findById('missing');
      expect(review).toBeNull();
    });
  });

  describe('findByOrderId', () => {
    it('should find review by order id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'review-1', orderId: 'order-1', craftsmanId: 'prof-1', clientId: 'user-1', rating: 5, comment: 'Great', createdAt: new Date() });

      const review = await repo.findByOrderId('order-1');
      expect(review).not.toBeNull();
      expect(review?.orderId).toBe('order-1');
    });

    it('should return null when no review for order', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const review = await repo.findByOrderId('missing');
      expect(review).toBeNull();
    });
  });

  describe('findByCraftsmanId', () => {
    it('should find reviews by craftsman id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'review-1', craftsmanId: 'prof-1', rating: 5, createdAt: new Date() },
      ]);

      const reviews = await repo.findByCraftsmanId('prof-1');
      expect(reviews).toHaveLength(1);
    });

    it('should return empty array when no reviews', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const reviews = await repo.findByCraftsmanId('prof-1');
      expect(reviews).toEqual([]);
    });
  });

  describe('findByClientId', () => {
    it('should find reviews by client id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'review-1', clientId: 'user-1', rating: 5, createdAt: new Date() },
      ]);

      const reviews = await repo.findByClientId('user-1');
      expect(reviews).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a review', async () => {
      const review = await repo.create({ orderId: 'order-1', craftsmanId: 'prof-1', clientId: 'user-1', rating: 5, comment: 'Great' } as any);
      expect(review.id).toBe('review-1');
    });

    it('should append outbox event on create', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new ReviewRepository(mockOutbox as any);
      await repoWithOutbox.create({ orderId: 'order-1', craftsmanId: 'prof-1', clientId: 'user-1', rating: 5, comment: 'Great' } as any);
      expect(mockOutbox.append).toHaveBeenCalled();
    });
  });

  describe('calculateAverageRating', () => {
    it('should calculate average rating', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'review-1', rating: 5 },
        { id: 'review-2', rating: 3 },
      ]);

      const avg = await repo.calculateAverageRating('prof-1');
      expect(avg).toBe(4);
    });

    it('should return 0 for no reviews', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const avg = await repo.calculateAverageRating('prof-1');
      expect(avg).toBe(0);
    });

    it('should round to 2 decimal places', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'review-1', rating: 5 },
        { id: 'review-2', rating: 4 },
        { id: 'review-3', rating: 4 },
      ]);

      const avg = await repo.calculateAverageRating('prof-1');
      expect(avg).toBeCloseTo(4.33, 2);
    });
  });

  describe('countByCraftsman', () => {
    it('should count reviews by craftsman', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'review-1' },
        { id: 'review-2' },
      ]);

      const count = await repo.countByCraftsman('prof-1');
      expect(count).toBe(2);
    });

    it('should return 0 when no reviews', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.reviews.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const count = await repo.countByCraftsman('prof-1');
      expect(count).toBe(0);
    });
  });
});
