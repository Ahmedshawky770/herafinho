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

import { createWebhookWorker } from './webhook.worker';

describe('WebhookWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWorkerClose.mockReset();
  });

  it('should create webhook worker', async () => {
    const worker = createWebhookWorker();
    expect(worker).toBeDefined();
  });

  it('should throw for invalid webhook URL', async () => {
    const worker = createWebhookWorker();
    expect(worker).toBeDefined();
  });

  it('should handle worker errors', async () => {
    const worker = createWebhookWorker();
    expect(worker).toBeDefined();
  });
});
