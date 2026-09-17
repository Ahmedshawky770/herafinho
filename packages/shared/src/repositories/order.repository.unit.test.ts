import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      orders: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'order-1', clientId: 'user-1', craftsmanId: 'prof-1', craftType: 'carpenter', status: 'pending', createdAt: new Date(), updatedAt: new Date() }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'order-1', clientId: 'user-1', craftsmanId: 'prof-1', craftType: 'carpenter', status: 'accepted', createdAt: new Date(), updatedAt: new Date() }]),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'order-1', clientId: 'user-1', status: 'pending', createdAt: new Date() }]),
        }),
      }),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
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
  orders: {},
}));

vi.mock('./outbox-repository', () => ({
  OutboxRepository: vi.fn().mockImplementation(() => ({
    append: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { OrderRepository } from './order.repository';

describe('OrderRepository', () => {
  let repo: OrderRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new OrderRepository();
  });

  describe('findById', () => {
    it('should find order by id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'order-1', clientId: 'user-1', status: 'pending', createdAt: new Date(), updatedAt: new Date() });

      const order = await repo.findById('order-1');
      expect(order).not.toBeNull();
      expect(order?.id).toBe('order-1');
    });

    it('should return null when order not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const order = await repo.findById('missing');
      expect(order).toBeNull();
    });
  });

  describe('findByClientId', () => {
    it('should find orders by client id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'order-1', clientId: 'user-1', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const orders = await repo.findByClientId('user-1');
      expect(orders).toHaveLength(1);
    });

    it('should return empty array when no orders found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const orders = await repo.findByClientId('user-1');
      expect(orders).toEqual([]);
    });
  });

  describe('findByCraftsmanId', () => {
    it('should find orders by craftsman id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'order-1', craftsmanId: 'prof-1', status: 'in_progress', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const orders = await repo.findByCraftsmanId('prof-1');
      expect(orders).toHaveLength(1);
    });
  });

  describe('findActiveByCraftsmanId', () => {
    it('should find active order by craftsman id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'order-1', craftsmanId: 'prof-1', status: 'in_progress', createdAt: new Date(), updatedAt: new Date() });

      const order = await repo.findActiveByCraftsmanId('prof-1');
      expect(order).not.toBeNull();
      expect(order?.status).toBe('in_progress');
    });

    it('should return null when no active order', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const order = await repo.findActiveByCraftsmanId('prof-1');
      expect(order).toBeNull();
    });
  });

  describe('create', () => {
    it('should create an order', async () => {
      const order = await repo.create({ clientId: 'user-1', craftsmanId: 'prof-1', craftType: 'carpenter', description: 'Fix door', address: 'Cairo', latitude: '30.0', longitude: '31.0' } as any);
      expect(order.id).toBe('order-1');
    });

    it('should append outbox event on create', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new OrderRepository(mockOutbox as any);
      await repoWithOutbox.create({ clientId: 'user-1', craftsmanId: 'prof-1', craftType: 'carpenter', description: 'Fix door', address: 'Cairo', latitude: '30.0', longitude: '31.0' } as any);
      expect(mockOutbox.append).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const order = await repo.updateStatus('order-1', 'accepted');
      expect(order.status).toBe('accepted');
    });

    it('should append outbox event on status update', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new OrderRepository(mockOutbox as any);
      await repoWithOutbox.updateStatus('order-1', 'accepted');
      expect(mockOutbox.append).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update order', async () => {
      const order = await repo.update('order-1', { description: 'Updated description' } as any);
      expect(order).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should cancel an order', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: 'order-1', clientId: 'user-1', status: 'cancelled', createdAt: new Date(), updatedAt: new Date() }]),
          }),
        }),
      });

      const order = await repo.cancel('order-1', 'user-1');
      expect(order.status).toBe('cancelled');
    });

    it('should append outbox event on cancel', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new OrderRepository(mockOutbox as any);
      const { db } = await import('@herafino/shared/db');
      (db.update as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        set: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
            returning: vi.fn().mockResolvedValueOnce([{ id: 'order-1', clientId: 'user-1', status: 'cancelled', createdAt: new Date(), updatedAt: new Date() }]),
          }),
        }),
      });

      await repoWithOutbox.cancel('order-1', 'user-1');
      expect(mockOutbox.append).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should find all orders', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'order-1', clientId: 'user-1', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const orders = await repo.findAll();
      expect(orders).toHaveLength(1);
    });

    it('should return empty array when no orders', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.orders.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const orders = await repo.findAll();
      expect(orders).toEqual([]);
    });
  });
});
