import { eq, and } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { orders } from '../db/schema';
function toDomain(order) {
    return {
        ...order,
        craftsmanId: order.craftsmanId ?? undefined,
        clientAcceptedFinalPrice: order.clientAcceptedFinalPrice ?? undefined,
        estimatedPrice: order.estimatedPrice ?? undefined,
        finalPrice: order.finalPrice ?? undefined,
        scheduledAt: order.scheduledAt ?? undefined,
        completedAt: order.completedAt ?? undefined,
    };
}
function buildEvent(event) {
    return { id: crypto.randomUUID(), ...event };
}
export class OrderRepository {
    outbox;
    constructor(outbox) {
        this.outbox = outbox;
    }
    async appendOutbox(event) {
        if (this.outbox)
            await this.outbox.append(event);
    }
    async findById(id) {
        const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
        return order ? toDomain(order) : null;
    }
    async findByClientId(clientId) {
        const result = await db.query.orders.findMany({
            where: eq(orders.clientId, clientId),
            orderBy: (o, { desc }) => [desc(o.createdAt)],
        });
        return result.map(toDomain);
    }
    async findByCraftsmanId(craftsmanId) {
        const result = await db.query.orders.findMany({
            where: eq(orders.craftsmanId, craftsmanId),
            orderBy: (o, { desc }) => [desc(o.createdAt)],
        });
        return result.map(toDomain);
    }
    async findActiveByCraftsmanId(craftsmanId) {
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.craftsmanId, craftsmanId), eq(orders.status, 'in_progress')),
        });
        return order ? toDomain(order) : null;
    }
    async create(order) {
        const [created] = await db.insert(orders).values({ ...order, craftType: order.craftType }).returning();
        logger.info({ orderId: created.id, clientId: created.clientId }, 'Order created');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: 'order.created',
            payload: { orderId: created.id, clientId: created.clientId, craftsmanId: created.craftsmanId, craftType: created.craftType },
            metadata: { occurredAt: new Date() },
        });
        return toDomain(created);
    }
    async updateStatus(id, status) {
        const [updated] = await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
        logger.info({ orderId: id, status }, 'Order status updated');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: `order.${status}`,
            payload: { orderId: updated.id, clientId: updated.clientId, craftsmanId: updated.craftsmanId, status: updated.status },
            metadata: { occurredAt: new Date() },
        });
        return toDomain(updated);
    }
    async update(id, data) {
        const drizzleData = { ...data, updatedAt: new Date() };
        if (drizzleData.craftType !== undefined)
            drizzleData.craftType = drizzleData.craftType;
        const [updated] = await db.update(orders).set(drizzleData).where(eq(orders.id, id)).returning();
        logger.info({ orderId: id, fields: Object.keys(data) }, 'Order updated');
        return toDomain(updated);
    }
    async cancel(id, userId) {
        const [updated] = await db.update(orders).set({ status: 'cancelled', updatedAt: new Date() }).where(and(eq(orders.id, id), eq(orders.clientId, userId))).returning();
        logger.info({ orderId: id, userId }, 'Order cancelled');
        await this.appendOutbox({
            id: crypto.randomUUID(),
            name: 'order.cancelled',
            payload: { orderId: updated.id, clientId: updated.clientId, craftsmanId: updated.craftsmanId },
            metadata: { occurredAt: new Date() },
        });
        return toDomain(updated);
    }
    async findAll() {
        const result = await db.query.orders.findMany({ orderBy: (o, { desc }) => [desc(o.createdAt)] });
        return result.map(toDomain);
    }
}
