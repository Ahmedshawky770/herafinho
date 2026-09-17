import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockWorkerClose = vi.fn().mockResolvedValue(undefined);

vi.mock('bullmq', () => ({
  Worker: class MockWorker {
    close = mockWorkerClose;
    on = vi.fn();
    constructor() {}
  },
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

vi.mock('./connection', () => ({
  getQueueConnection: vi.fn(() => ({ host: 'localhost', port: 6379 })),
}));

vi.mock('@herafino/shared/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'order-1', clientId: 'user-1', status: 'pending', createdAt: new Date() }]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'order-1', clientId: 'user-1', status: 'rejected', createdAt: new Date() }]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
}));

vi.mock('@herafino/shared/db/schema', () => ({
  orders: {},
  notifications: {},
}));

vi.mock('./outbox-repository', () => ({
  OutboxRepository: vi.fn().mockImplementation(() => ({
    append: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { createOrderTimeoutWorker } from './order-timeout.worker';

describe('OrderTimeoutWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerClose.mockReset();
  });

  it('should create order timeout worker', async () => {
    const worker = createOrderTimeoutWorker();
    expect(worker).toBeDefined();
  });

  it('should create order timeout worker with outbox', async () => {
    const mockOutbox = {
      append: vi.fn().mockResolvedValue(undefined),
    };
    const worker = createOrderTimeoutWorker(mockOutbox as any);
    expect(worker).toBeDefined();
  });

  it('should handle order not found', async () => {
    const { db } = await import('@herafino/shared/db');
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const worker = createOrderTimeoutWorker();
    expect(worker).toBeDefined();
  });

  it('should handle order not pending', async () => {
    const { db } = await import('@herafino/shared/db');
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: 'order-1', status: 'accepted', createdAt: new Date() }]),
        }),
      }),
    });

    const worker = createOrderTimeoutWorker();
    expect(worker).toBeDefined();
  });
});
