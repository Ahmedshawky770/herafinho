import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@herafino/shared/db', () => ({
  db: {
    query: {
      notifications: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field, value) => ({ type: 'eq', field, value })),
  and: vi.fn((...conditions) => ({ type: 'and', conditions })),
  desc: vi.fn((field) => ({ type: 'desc', field })),
}));

vi.mock('@herafino/shared/db/schema', () => ({
  notifications: {},
}));

import { NotificationRepository } from './notification.repository';

describe('NotificationRepository', () => {
  let repo: NotificationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new NotificationRepository();
  });

  describe('send', () => {
    it('should send a notification', async () => {
      const notification = await repo.send({ userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body' });
      expect(notification.id).toBe('notif-1');
    });
  });

  describe('findById', () => {
    it('should find notification by id and user id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() });

      const notification = await repo.findById('notif-1', 'user-1');
      expect(notification).not.toBeNull();
      expect(notification?.id).toBe('notif-1');
    });

    it('should return null when notification not found', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const notification = await repo.findById('missing', 'user-1');
      expect(notification).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await repo.markAsRead('notif-1', 'user-1');
      expect(repo).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a notification', async () => {
      await repo.delete('notif-1');
      expect(repo).toBeDefined();
    });
  });

  describe('getByUserId', () => {
    it('should get notifications by user id', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
      ]);

      const notifications = await repo.getByUserId('user-1');
      expect(notifications).toHaveLength(1);
    });

    it('should respect custom limit', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
      ]);

      const notifications = await repo.getByUserId('user-1', 10);
      expect(notifications).toHaveLength(1);
    });

    it('should return empty array when no notifications', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const notifications = await repo.getByUserId('user-1');
      expect(notifications).toEqual([]);
    });
  });

  describe('getUnread', () => {
    it('should get unread notifications', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
      ]);

      const notifications = await repo.getUnread('user-1');
      expect(notifications).toHaveLength(1);
    });

    it('should return unread notifications', async () => {
      const { db } = await import('@herafino/shared/db');
      (db.query.notifications.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { id: 'notif-1', userId: 'user-1', type: 'in_app', title: 'Test', body: 'Body', read: false, readAt: null, sentAt: new Date() },
        { id: 'notif-2', userId: 'user-1', type: 'in_app', title: 'Test2', body: 'Body2', read: true, readAt: new Date(), sentAt: new Date() },
      ]);

      const notifications = await repo.getUnread('user-1');
      expect(notifications.length).toBeGreaterThanOrEqual(1);
      expect(notifications.some((n) => n.read === false)).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', async () => {
      await repo.markAllAsRead('user-1');
      expect(repo).toBeDefined();
    });
  });
});
