import { eq, and } from 'drizzle-orm';
import { db } from '@herafino/shared/db';
import { notifications } from '@herafino/shared/db/schema';
import type { ID, Notification } from '@herafino/types';

function toDomain(row: typeof notifications.$inferSelect): Notification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body,
    read: row.read,
    readAt: row.readAt ?? undefined,
    sentAt: row.sentAt,
  };
}

export class NotificationRepository {
  async send(notification: { userId: ID; type: 'email' | 'in_app' | 'push'; title: string; body: string }): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return toDomain(created);
  }

  async markAsRead(id: ID, userId: ID): Promise<void> {
    await db.update(notifications).set({ read: true, readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async getByUserId(userId: ID, limit = 50): Promise<Notification[]> {
    const result = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: (n, { desc }) => [desc(n.sentAt)],
      limit,
    });
    return result.map(toDomain);
  }
}