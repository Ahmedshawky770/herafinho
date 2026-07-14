import type { Notification, NewNotification } from '@herafino/types';
import { eq } from 'drizzle-orm';
import { db, notifications, type Notification as SchemaNotification } from '@herafino/shared';
import { logger } from '@herafino/shared';

export function toDomain(notification: SchemaNotification): Notification {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    read: notification.read,
    readAt: notification.readAt ?? undefined,
    sentAt: notification.sentAt,
  };
}

export class DatabaseNotificationService {
  async send(notification: NewNotification): Promise<Notification> {
    const [row] = await db.insert(notifications).values({
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
    }).returning();
    return toDomain(row);
  }

  async sendBatch(notificationsInput: NewNotification[]): Promise<Notification[]> {
    if (notificationsInput.length === 0) return [];
    const rows = await db.insert(notifications).values(
      notificationsInput.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
      }))
    ).returning();
    return rows.map(toDomain);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const [updated] = await db
      .update(notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    if (!updated) {
      logger.warn({ notificationId: id, userId }, 'Notification not found for read update');
    }
  }

  async getUnread(userId: string): Promise<Notification[]> {
    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: (n, { desc }) => [desc(n.sentAt)],
    });
    return rows.filter((n) => !n.read).map(toDomain);
  }

  async getByUserId(userId: string, limit = 50): Promise<Notification[]> {
    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: (n, { desc }) => [desc(n.sentAt)],
      limit,
    });
    return rows.map(toDomain);
  }
}
