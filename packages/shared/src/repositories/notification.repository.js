import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { notifications } from '../db/schema';
function toDomain(row) {
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
    async send(notification) {
        const [created] = await db.insert(notifications).values(notification).returning();
        return toDomain(created);
    }
    async findById(id, userId) {
        const result = await db.query.notifications.findFirst({
            where: and(eq(notifications.id, id), eq(notifications.userId, userId)),
        });
        return result ? toDomain(result) : null;
    }
    async markAsRead(id, userId) {
        await db.update(notifications).set({ read: true, readAt: new Date() }).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    }
    async delete(id) {
        await db.delete(notifications).where(eq(notifications.id, id));
    }
    async getByUserId(userId, limit = 50) {
        const result = await db.query.notifications.findMany({
            where: eq(notifications.userId, userId),
            orderBy: (n, { desc }) => [desc(n.sentAt)],
            limit,
        });
        return result.map(toDomain);
    }
    async getUnread(userId) {
        const result = await db.query.notifications.findMany({
            where: and(eq(notifications.userId, userId), eq(notifications.read, false)),
            orderBy: (n, { desc }) => [desc(n.sentAt)],
        });
        return result.map(toDomain);
    }
    async markAllAsRead(userId) {
        await db.update(notifications).set({ read: true, readAt: new Date() }).where(eq(notifications.userId, userId));
    }
}
