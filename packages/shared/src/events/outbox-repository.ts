import { eq, and, lt } from 'drizzle-orm';
import type { DomainEvent, OutboxMessage } from '@herafino/types';
import { db } from '../db';
import { eventOutbox } from '../db/schema';
import { logger } from '../logger/factory';

export class OutboxRepository {
  async append(event: DomainEvent): Promise<void> {
    await db.insert(eventOutbox).values({
      eventName: event.name,
      payload: event.payload as Record<string, unknown>,
      metadata: event.metadata as Record<string, unknown>,
      status: 'pending',
    });
    logger.info(
      { component: 'outbox', eventName: event.name, eventId: event.id },
      'Event appended to outbox'
    );
  }

  async getPending(limit: number): Promise<OutboxMessage[]> {
    const events = await db.query.eventOutbox.findMany({
      where: and(eq(eventOutbox.status, 'pending'), lt(eventOutbox.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))),
      orderBy: (e, { asc }) => [asc(e.createdAt)],
      limit,
    });
    return events.map((row) => ({
      id: row.id,
      eventName: row.eventName as DomainEvent['name'],
      payload: row.payload,
      metadata: row.metadata,
      status: row.status as 'pending' | 'processing' | 'completed' | 'failed',
      retryCount: 0,
      nextRetryAt: new Date(),
      lastError: row.lastError ?? undefined,
      createdAt: row.createdAt,
      processedAt: row.processedAt ?? undefined,
    })) as OutboxMessage[];
  }

  async markCompleted(id: string): Promise<void> {
    await db.update(eventOutbox).set({ status: 'completed', processedAt: new Date() }).where(eq(eventOutbox.id, id));
    logger.info({ component: 'outbox', id }, 'Outbox message marked completed');
  }

  async markProcessed(id: string): Promise<void> {
    await this.markCompleted(id);
  }

  async markFailed(id: string, error: string): Promise<void> {
    await db.update(eventOutbox).set({ status: 'failed', lastError: error }).where(eq(eventOutbox.id, id));
    logger.error({ component: 'outbox', id, error }, 'Outbox message marked failed');
  }

  async cleanup(maxAgeDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
    const result = await db.delete(eventOutbox).where(and(eq(eventOutbox.status, 'completed'), lt(eventOutbox.createdAt, cutoff)));
    return result.length ?? 0;
  }
}
