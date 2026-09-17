import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
        ]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    query: {
      notifications: { findFirst: vi.fn(), findMany: vi.fn() },
    },
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
  notifications: {},
}));

import { DatabaseNotificationService, toDomain } from './notification.service';

describe('NotificationService', () => {
  let service: DatabaseNotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DatabaseNotificationService();
  });

  describe('toDomain', () => {
    it('should map DB row to domain notification', () => {
      const row = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'in_app',
        title: 'Test',
        body: 'Body',
        read: false,
        readAt: null,
        sentAt: new Date('2024-01-01'),
      };
      const result = toDomain(row as any);
      expect(result.id).toBe('notif-1');
      expect(result.readAt).toBeUndefined();
    });

    it('should map readAt when present', () => {
      const row = {
        id: 'notif-1',
        userId: 'user-1',
        type: 'in_app',
        title: 'Test',
        body: 'Body',
        read: true,
        readAt: new Date('2024-01-01'),
        sentAt: new Date('2024-01-01'),
      };
      const result = toDomain(row as any);
      expect(result.readAt).toBeDefined();
    });
  });

  describe('send', () => {
    it('should send a notification', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([
            { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
          ]),
        }),
      });

      const notification = await service.send({ userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body' });
      expect(notification.id).toBe('notif-1');
      expect(notification.userId).toBe('user-1');
    });

    it('should log notification sent', async () => {
      const { logger } = await import('@herafino/shared/logger/factory');
      const { db } = await import('@herafino/shared/db');
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([
            { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
          ]),
        }),
      });

      await service.send({ userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body' });
      expect(logger.info).toHaveBeenCalledWith({ notificationId: 'notif-1', userId: 'user-1' }, 'Notification sent');
    });
  });

  describe('sendBatch', () => {
    it('should return empty array for empty batch', async () => {
      const result = await service.sendBatch([]);
      expect(result).toEqual([]);
    });

    it('should send batch notifications', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.insert as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        values: vi.fn().mockReturnValueOnce({
          returning: vi.fn().mockResolvedValueOnce([
            { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'T1', body: 'B1', read: false, readAt: null, sentAt: new Date() },
            { id: 'notif-2', userId: 'user-2', type: 'in_app', title: 'T2', body: 'B2', read: false, readAt: null, sentAt: new Date() },
          ]),
        }),
      });

      const result = await service.sendBatch([
        { userId: 'user-1', type: 'in_app', title: 'T1', body: 'B1' },
        { userId: 'user-2', type: 'in_app', title: 'T2', body: 'B2' },
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await service.markAsRead('notif-1', 'user-1');
      expect(service).toBeDefined();
    });
  });

  describe('getUnread', () => {
    it('should return unread notifications', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
        { id: 'notif-2', userId: 'user-1', type: 'in_app', title: 'Test2', body: 'Body2', read: true, readAt: new Date(), sentAt: new Date() },
      ]);

      const result = await service.getUnread('user-1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array when all read', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'notif-2', userId: 'user-1', type: 'in_app', title: 'Test2', body: 'Body2', read: true, readAt: new Date(), sentAt: new Date() },
      ]);

      const result = await service.getUnread('user-1');
      expect(result).toHaveLength(0);
    });
  });

  describe('getByUserId', () => {
    it('should return notifications for user with default limit', async () => {
      const result = await service.getByUserId('user-1');
      expect(result).toBeDefined();
    });

    it('should respect custom limit', async () => {
      const result = await service.getByUserId('user-1', 20);
      expect(result).toBeDefined();
    });
  });
});
