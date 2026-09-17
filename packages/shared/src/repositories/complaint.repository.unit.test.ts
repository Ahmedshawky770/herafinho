import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      complaints: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'comp-1', reporterId: 'user-1', againstUserId: 'user-2', reason: 'spam', status: 'pending', createdAt: new Date(), updatedAt: new Date() }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'comp-1', reporterId: 'user-1', againstUserId: 'user-2', reason: 'spam', status: 'resolved', actionTaken: 'warn', resolvedBy: 'admin-1', resolvedAt: new Date(), createdAt: new Date(), updatedAt: new Date() }]),
        }),
      }),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
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
  complaints: {},
}));

vi.mock('./outbox-repository', () => ({
  OutboxRepository: vi.fn().mockImplementation(() => ({
    append: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { ComplaintRepository } from './complaint.repository';

describe('ComplaintRepository', () => {
  let repo: ComplaintRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ComplaintRepository();
  });

  describe('findById', () => {
    it('should find complaint by id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'comp-1', reporterId: 'user-1', againstUserId: 'user-2', reason: 'spam', status: 'pending', createdAt: new Date(), updatedAt: new Date() });

      const complaint = await repo.findById('comp-1');
      expect(complaint).not.toBeNull();
      expect(complaint?.id).toBe('comp-1');
    });

    it('should return null when complaint not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const complaint = await repo.findById('missing');
      expect(complaint).toBeNull();
    });
  });

  describe('findByReporterId', () => {
    it('should find complaints by reporter id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'comp-1', reporterId: 'user-1', againstUserId: 'user-2', reason: 'spam', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const complaints = await repo.findByReporterId('user-1');
      expect(complaints).toHaveLength(1);
    });

    it('should return empty array when no complaints found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const complaints = await repo.findByReporterId('user-1');
      expect(complaints).toEqual([]);
    });
  });

  describe('findByAgainstUserId', () => {
    it('should find complaints against user', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'comp-1', reporterId: 'user-1', againstUserId: 'user-2', reason: 'spam', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const complaints = await repo.findByAgainstUserId('user-2');
      expect(complaints).toHaveLength(1);
    });
  });

  describe('findPending', () => {
    it('should find pending complaints', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'comp-1', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const complaints = await repo.findPending();
      expect(complaints).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create a complaint', async () => {
      const complaint = await repo.create({
        reporterId: 'user-1',
        againstUserId: 'user-2',
        reason: 'spam',
        description: 'Spamming',
        orderId: 'order-1',
        evidenceUrls: ['http://img.jpg'],
      } as any);
      expect(complaint.id).toBe('comp-1');
    });

    it('should default evidenceUrls to empty array', async () => {
      const complaint = await repo.create({
        reporterId: 'user-1',
        againstUserId: 'user-2',
        reason: 'spam',
        description: 'Spamming',
      } as any);
      expect(complaint.evidenceUrls).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update complaint status', async () => {
      const complaint = await repo.updateStatus('comp-1', 'resolved');
      expect(complaint.status).toBe('resolved');
    });

    it('should not append outbox for pending status', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new ComplaintRepository(mockOutbox as any);
      await repoWithOutbox.updateStatus('comp-1', 'pending');
      expect(mockOutbox.append).not.toHaveBeenCalled();
    });

    it('should append outbox for non-pending status', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new ComplaintRepository(mockOutbox as any);
      await repoWithOutbox.updateStatus('comp-1', 'resolved');
      expect(mockOutbox.append).toHaveBeenCalled();
    });
  });

  describe('resolve', () => {
    it('should resolve a complaint', async () => {
      const complaint = await repo.resolve('comp-1', 'warn', 'admin-1');
      expect(complaint.status).toBe('resolved');
    });

    it('should append outbox on resolve', async () => {
      const mockOutbox = {
        append: vi.fn().mockResolvedValue(undefined),
      };
      const repoWithOutbox = new ComplaintRepository(mockOutbox as any);
      await repoWithOutbox.resolve('comp-1', 'warn', 'admin-1');
      expect(mockOutbox.append).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should find all complaints', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'comp-1', reporterId: 'user-1', againstUserId: 'user-2', reason: 'spam', status: 'pending', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const complaints = await repo.findAll();
      expect(complaints).toHaveLength(1);
    });

    it('should return empty array when no complaints', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.complaints.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const complaints = await repo.findAll();
      expect(complaints).toEqual([]);
    });
  });
});
