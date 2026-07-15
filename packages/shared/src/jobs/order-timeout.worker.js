import { Worker } from 'bullmq';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { orders, notifications } from '../db/schema';
import { logger } from '../logger/factory';
import { getQueueConnection } from './connection';
const ORDER_TIMEOUT_QUEUE_NAME = 'order-timeout';
const PENDING_TIMEOUT_HOURS = 48;
/**
 * Consumes the `order-timeout` queue produced by `enqueueOrderTimeoutCheck` in
 * @herafino/shared/services. The job payload is `{ orderId }`.
 */
export function createOrderTimeoutWorker(outbox) {
    const worker = new Worker(ORDER_TIMEOUT_QUEUE_NAME, async (job) => {
        const { orderId } = job.data;
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
            const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceCreation < PENDING_TIMEOUT_HOURS) {
                logger.info({ orderId, hoursSinceCreation, threshold: PENDING_TIMEOUT_HOURS }, 'Order still within timeout window');
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
                const event = {
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
        }
        catch (error) {
            logger.error({ orderId, error: error instanceof Error ? error.message : String(error) }, 'Order timeout check failed');
            throw error;
        }
    }, {
        connection: getQueueConnection(),
        concurrency: 5,
    });
    worker.on('completed', (job) => {
        logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Order timeout job completed');
    });
    worker.on('failed', (job, error) => {
        logger.error({ jobId: job?.id, orderId: job?.data?.orderId, error: error.message }, 'Order timeout job failed');
    });
    return worker;
}
async function notifyOrderTimeout(orderId, order) {
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
    }
    catch (error) {
        logger.error({ orderId, error: error instanceof Error ? error.message : String(error) }, 'Failed to send order timeout notification');
    }
}
