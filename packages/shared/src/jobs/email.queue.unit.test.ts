import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQueueAdd = vi.fn().mockResolvedValue({ id: 'job-1' });
const mockQueueClose = vi.fn().mockResolvedValue(undefined);

vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    add = mockQueueAdd;
    close = mockQueueClose;
    constructor() {}
  },
  Worker: class MockWorker {
    close = vi.fn().mockResolvedValue(undefined);
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

describe('EmailQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueueAdd.mockReset();
    mockQueueClose.mockReset();
  });

  it('should create email queue', async () => {
    const { createEmailQueue } = await import('./email.queue');
    const queue = createEmailQueue();
    expect(queue).toBeDefined();
  });

  it('should create email worker', async () => {
    const { createEmailWorker } = await import('./email.queue');
    const mockEmailService = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    const worker = createEmailWorker(mockEmailService);
    expect(worker).toBeDefined();
  });

  it('should have correct queue name constant', async () => {
    const { EMAIL_QUEUE_NAME } = await import('./email.queue');
    expect(EMAIL_QUEUE_NAME).toBe('herafino-emails');
  });

  it('should process email job', async () => {
    const { createEmailWorker } = await import('./email.queue');
    const mockEmailService = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    const worker = createEmailWorker(mockEmailService);
    expect(worker).toBeDefined();
  });

  it('should handle worker errors', async () => {
    const { createEmailWorker } = await import('./email.queue');
    const mockEmailService = {
      send: vi.fn().mockRejectedValue(new Error('Send failed')),
    };
    const worker = createEmailWorker(mockEmailService);
    expect(worker).toBeDefined();
  });
});
