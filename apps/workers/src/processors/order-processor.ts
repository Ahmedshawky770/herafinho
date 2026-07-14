import { Queue, Worker } from 'bullmq';
import { db } from '@herafino/shared';
import { orders, notifications } from '@herafino/shared';
import { OutboxRepository } from '@herafino/shared';
import { logger } from '@herafino/shared';
import type { DomainEvent } from '@herafino/types';

const connection = {
  host: process.env.VALKEY_HOST?.split('://')[1]?.split(':')[0] ?? 'localhost',
  port: parseInt(process.env.VALKEY_PORT ?? '6379', 10),
};

const PENDING_TIMEOUT_HOURS = 48;

export function createOrderTimeoutQueue(connection: { host: string; port: number }) {
  return new Queue('order-timeout', { connection });
}

export async function enqueueOrderTimeoutCheck(orderId: string, checkAt: Date): Promise<void> {
  const host = process.env.VALKEY_HOST?.split('://')[1]?.split(':')[0] ?? 'localhost';
  const port = parseInt(process.env.VALKEY_PORT ?? '6379', 10);
  const queue = createOrderTimeoutQueue({ host, port });

  await queue.add(
    'check-timeout',
    { orderId, checkAt: checkAt.toISOString() },
    {
      delay: Math.max(0, checkAt.getTime() - Date.now()),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  logger.info({ orderId, checkAt: checkAt.toISOString() }, 'Order timeout check enqueued');
}

export function createOrderTimeoutWorker(outbox?: OutboxRepository): Worker {
  const worker = new Worker(
    'order-timeout',
    async (job) => {
      const { orderId, checkAt } = job.data;

      try {
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (!order) {
          logger.warn({ orderId }, 'Order not found for timeout check');
          return;
        }

        if (order.status !== 'pending') {
          logger.info({ orderId, status: order.status }, 'Order no longer pending, skipping timeout');
          return;
        }

        const createdAt = new Date(order.createdAt);
        const checkDate = new Date(checkAt);
        const hoursSinceCreation = (checkDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceCreation < PENDING_TIMEOUT_HOURS) {
          logger.info(
            { orderId, hoursSinceCreation, threshold: PENDING_TIMEOUT_HOURS },
            'Order still within timeout window'
          );
          return;
        }

        const [updated] = await db
          .update(orders)
          .set({
            status: 'rejected',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId))
          .returning();

        if (!updated) {
          logger.warn({ orderId }, 'Failed to update order for timeout');
          return;
        }

        logger.info({ orderId, status: updated.status }, 'Order auto-rejected due to timeout');

        if (outbox) {
          const event: DomainEvent = {
            id: crypto.randomUUID(),
            name: 'order.rejected',
            payload: {
              orderId: updated.id,
              reason: 'timeout',
              autoRejected: true,
            },
            metadata: {
              occurredAt: new Date(),
              correlationId: orderId,
              causationId: orderId,
            },
          };

          await outbox.append(event);
        }

        await notifyOrderTimeout(orderId, updated);
      } catch (error) {
        logger.error(
          { orderId, error: error instanceof Error ? error.message : String(error) },
          'Order timeout check failed'
        );
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Order timeout job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error(
      { jobId: job?.id, orderId: job?.data.orderId, error: error.message },
      'Order timeout job failed'
    );
  });

  return worker;
}

async function notifyOrderTimeout(orderId: string, order: typeof orders.$inferSelect): Promise<void> {
  try {
    if (order.clientId) {
      await db.insert(notifications).values({
        userId: order.clientId,
        type: 'in_app',
        title: 'انتهت مهلة الطلب',
        body: `لم يتم قبول طلبك (${orderId.slice(0, 8)}) خلال 48 ساعة. يمكنك إنشاء طلب جديد.`,
        read: false,
      });

      logger.info({ orderId, clientId: order.clientId }, 'Order timeout notification sent to client');
    }
  } catch (error) {
    logger.error(
      { orderId, error: error instanceof Error ? error.message : String(error) },
      'Failed to send order timeout notification'
    );
  }
}
