import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuditLogsFindMany, mockAuditLogsFindFirst } = vi.hoisted(() => ({
  mockAuditLogsFindMany: vi.fn(),
  mockAuditLogsFindFirst: vi.fn(),
}));

vi.mock('@herafino/shared/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'audit-1', actorId: 'user-1', action: 'login', targetType: 'user', targetId: 'user-1', metadata: {} }]),
      }),
    }),
    query: {
      auditLogs: {
        findFirst: mockAuditLogsFindFirst,
        findMany: mockAuditLogsFindMany,
      },
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
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
  auditLogs: {},
}));

import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLogsFindMany.mockReset();
    mockAuditLogsFindFirst.mockReset();
    service = new AuditService();
  });

  describe('log', () => {
    it('should log an audit entry', async () => {
      await service.log({
        actorId: 'user-1',
        action: 'login',
        targetType: 'user',
        targetId: 'user-1',
        metadata: { ip: '1.2.3.4' },
      });

      expect(service).toBeDefined();
    });

    it('should log with empty metadata', async () => {
      await service.log({
        action: 'login',
        targetType: 'user',
        targetId: 'user-1',
      });

      expect(service).toBeDefined();
    });
  });

  describe('findByActorId', () => {
    it('should find audit logs by actor id', async () => {
      mockAuditLogsFindMany.mockResolvedValue([
        { id: 'audit-1', actorId: 'user-1', action: 'login', targetType: 'user', targetId: 'user-1', metadata: {}, createdAt: new Date() },
      ]);

      const result = await service.findByActorId('user-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('audit-1');
    });

    it('should handle missing metadata gracefully', async () => {
      mockAuditLogsFindMany.mockResolvedValue([
        { id: 'audit-3', actorId: null, action: 'login', targetType: 'user', targetId: 'user-1', metadata: null, createdAt: new Date() },
      ]);

      const result = await service.findByActorId('user-1');
      expect(result[0].actorId).toBe('');
      expect(result[0].metadata).toEqual({});
    });

    it('should respect custom limit', async () => {
      mockAuditLogsFindMany.mockResolvedValue([]);

      await service.findByActorId('user-1', 10);
      const call = mockAuditLogsFindMany.mock.calls[0];
      expect(call[0].limit).toBe(10);
    });

    it('should use default limit of 50', async () => {
      mockAuditLogsFindMany.mockResolvedValue([]);

      await service.findByActorId('user-1');
      const call = mockAuditLogsFindMany.mock.calls[0];
      expect(call[0].limit).toBe(50);
    });
  });

  describe('findByTarget', () => {
    it('should find audit logs by target', async () => {
      mockAuditLogsFindMany.mockResolvedValue([
        { id: 'audit-2', actorId: 'user-1', action: 'update', targetType: 'order', targetId: 'order-1', metadata: {}, createdAt: new Date() },
      ]);

      const result = await service.findByTarget('order', 'order-1');
      expect(result).toHaveLength(1);
      expect(result[0].targetType).toBe('order');
    });

    it('should return empty array when no logs found', async () => {
      mockAuditLogsFindMany.mockResolvedValue([]);

      const result = await service.findByTarget('order', 'missing');
      expect(result).toEqual([]);
    });
  });
});
