import { Queue } from 'bullmq';
import { logger } from '../logger/factory';
import type { ID } from '@herafino/types';

function getValkeyConnection() {
  const url = process.env.VALKEY_URL ?? 'valkey://localhost:6379';
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || process.env.VALKEY_PASSWORD,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
      password: process.env.VALKEY_PASSWORD,
    };
  }
}

export const webhookQueue = new Queue('webhook', {
  connection: getValkeyConnection(),
});

export const orderTimeoutQueue = new Queue('order-timeout', {
  connection: getValkeyConnection(),
});

export async function enqueueOrderTimeoutCheck(orderId: ID, timeoutAt: Date): Promise<void> {
  const delay = timeoutAt.getTime() - Date.now();
  if (delay <= 0) {
    logger.warn({ orderId }, 'Order timeout already passed');
    return;
  }

  await orderTimeoutQueue.add(
    'order:timeout-check',
    { orderId },
    { delay, jobId: `timeout:${orderId}`, removeOnComplete: true }
  );
  logger.info({ orderId, timeoutAt: timeoutAt.toISOString() }, 'Order timeout job enqueued');
}

export async function dispatchWebhook(event: string, payload: Record<string, unknown>, secret?: string): Promise<void> {
  const webhooks = await findActiveWebhooksByEvent(event);
  if (webhooks.length === 0) {
    logger.debug({ event }, 'No active webhooks for event');
    return;
  }

  for (const webhook of webhooks) {
    await webhookQueue.add(
      'webhook:send',
      { url: webhook.url, payload: { event, ...payload }, secret: webhook.secret },
      { jobId: `webhook:${webhook.id}:${Date.now()}`, removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
    );
  }
  logger.info({ event, webhookCount: webhooks.length }, 'Webhooks dispatched');
}

async function findActiveWebhooksByEvent(event: string): Promise<Array<{ id: string; url: string; secret: string }>> {
  const { webhooks } = await import('../db/schema');
  const { db } = await import('../db');
  const { eq } = await import('drizzle-orm');
  const rows = await db.query.webhooks.findMany({
    where: eq(webhooks.event, event),
  });
  return rows.map((w) => ({ id: w.id, url: w.url, secret: w.secret }));
}