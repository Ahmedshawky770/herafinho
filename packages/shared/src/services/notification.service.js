import { eq, and } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { notifications } from '../db/schema';
export function toDomain(row) {
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
export class DatabaseNotificationService {
    async send(notification) {
        const [created] = await db.insert(notifications).values(notification).returning();
        logger.info({ notificationId: created.id, userId: notification.userId }, 'Notification sent');
        return toDomain(created);
    }
    async sendBatch(notificationsBatch) {
        if (notificationsBatch.length === 0)
            return [];
        const created = await db.insert(notifications).values(notificationsBatch).returning();
        logger.info({ count: created.length }, 'Batch notifications sent');
        return created.map(toDomain);
    }
    async markAsRead(id, userId) {
        await db.update(notifications).set({ read: true, readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
        logger.info({ notificationId: id, userId }, 'Notification marked as read');
    }
    async getUnread(userId) {
        const result = await db.query.notifications.findMany({
            where: eq(notifications.userId, userId),
            orderBy: (n, { desc }) => [desc(n.sentAt)],
        });
        return result.filter((n) => !n.read).map(toDomain);
    }
    async getByUserId(userId, limit = 50) {
        const result = await db.query.notifications.findMany({
            where: eq(notifications.userId, userId),
            orderBy: (n, { desc }) => [desc(n.sentAt)],
            limit,
        });
        return result.map(toDomain);
    }
}
