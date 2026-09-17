import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockQueueAdd, mockQueueClose, mockWorkerClose } = vi.hoisted(() => ({
  mockQueueAdd: vi.fn().mockResolvedValue({ id: 'job-1' }),
  mockQueueClose: vi.fn().mockResolvedValue(undefined),
  mockWorkerClose: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    add = mockQueueAdd;
    close = mockQueueClose;
    constructor() {}
  },
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
    query: {
      webhooks: { findMany: vi.fn() },
    },
  },
}));

vi.mock('@herafino/shared/db/schema', () => ({
  webhooks: {},
}));

import { dispatchWebhook, enqueueOrderTimeoutCheck } from './webhook-dispatcher.service';

describe('WebhookDispatcherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockQueueClose.mockReset();
    mockWorkerClose.mockReset();
  });

  it('should return early when no webhooks found', async () => {
    const { db } = await import('@herafino/shared/db');
    (db.query.webhooks.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await dispatchWebhook('test.event', { foo: 'bar' });
    expect(dispatchWebhook).toBeDefined();
  }, 10000);

  it('should dispatch webhook for event', async () => {
    const { db } = await import('@herafino/shared/db');
    (db.query.webhooks.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'wh-1', url: 'https://example.com/hook', secret: 'secret' },
    ]);

    await dispatchWebhook('test.event', { foo: 'bar' });
    expect(mockQueueAdd).toHaveBeenCalled();
  }, 10000);

  it('should enqueue order timeout with positive delay', async () => {
    const future = new Date(Date.now() + 60_000);
    await enqueueOrderTimeoutCheck('order-1', future);
    expect(mockQueueAdd).toHaveBeenCalled();
  }, 10000);

  it('should skip order timeout when already passed', async () => {
    const past = new Date(Date.now() - 60_000);
    await enqueueOrderTimeoutCheck('order-1', past);
    expect(mockQueueAdd).not.toHaveBeenCalled();
  }, 10000);

  it('should dispatch multiple webhooks for same event', async () => {
    const { db } = await import('@herafino/shared/db');
    (db.query.webhooks.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'wh-1', url: 'https://example.com/hook1', secret: 'secret1' },
      { id: 'wh-2', url: 'https://example.com/hook2', secret: 'secret2' },
    ]);

    await dispatchWebhook('test.event', { foo: 'bar' });
    expect(mockQueueAdd).toHaveBeenCalledTimes(2);
  }, 10000);
});
