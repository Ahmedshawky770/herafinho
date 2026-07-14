import type { ID, NewOrder, Order, OrderStatus } from '@herafino/types';
import type { IOrderRepository } from '@herafino/contracts';
import { eq, and } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { orders, type Order as SchemaOrder } from '../db/schema';
import type { DomainEvent } from '@herafino/types';
import { OutboxRepository } from '../events/outbox-repository';

function toDomain(order: SchemaOrder): Order {
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

function buildEvent(event: Omit<DomainEvent, 'id' | 'metadata'> & { metadata: DomainEvent['metadata'] }): DomainEvent {
  return { id: crypto.randomUUID(), ...event };
}

export class OrderRepository implements IOrderRepository {
  constructor(private readonly outbox?: OutboxRepository) {}

  async appendOutbox(event: DomainEvent): Promise<void> {
    if (this.outbox) await this.outbox.append(event);
  }

  async findById(id: ID): Promise<Order | null> {
    const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
    return order ? toDomain(order) : null;
  }

  async findByClientId(clientId: ID): Promise<Order[]> {
    const result = await db.query.orders.findMany({
      where: eq(orders.clientId, clientId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
    return result.map(toDomain);
  }

  async findByCraftsmanId(craftsmanId: ID): Promise<Order[]> {
    const result = await db.query.orders.findMany({
      where: eq(orders.craftsmanId, craftsmanId),
      orderBy: (o, { desc }) => [desc(o.createdAt)],
    });
    return result.map(toDomain);
  }

  async findActiveByCraftsmanId(craftsmanId: ID): Promise<Order | null> {
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.craftsmanId, craftsmanId), eq(orders.status, 'in_progress')),
    });
    return order ? toDomain(order) : null;
  }

  async create(order: NewOrder): Promise<Order> {
    const [created] = await db.insert(orders).values({ ...order, craftType: order.craftType } as any).returning();
    logger.info({ orderId: created.id, clientId: created.clientId }, 'Order created');
    await this.appendOutbox({
      id: crypto.randomUUID(),
      name: 'order.created',
      payload: { orderId: created.id, clientId: created.clientId, craftsmanId: created.craftsmanId, craftType: created.craftType },
      metadata: { occurredAt: new Date() },
    });
    return toDomain(created);
  }

  async updateStatus(id: ID, status: OrderStatus): Promise<Order> {
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

  async update(id: ID, data: Partial<Order>): Promise<Order> {
    const drizzleData: Record<string, unknown> = { ...data, updatedAt: new Date() };
    if (drizzleData.craftType !== undefined) drizzleData.craftType = drizzleData.craftType as Order['craftType'];
    const [updated] = await db.update(orders).set(drizzleData).where(eq(orders.id, id)).returning();
    logger.info({ orderId: id, fields: Object.keys(data) }, 'Order updated');
    return toDomain(updated);
  }

  async cancel(id: ID, userId: ID): Promise<Order> {
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

  async findAll(): Promise<Order[]> {
    const result = await db.query.orders.findMany({ orderBy: (o, { desc }) => [desc(o.createdAt)] });
    return result.map(toDomain);
  }
}
