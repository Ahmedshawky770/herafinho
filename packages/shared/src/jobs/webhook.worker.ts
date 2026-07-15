import { Worker } from 'bullmq';
import { logger } from '../logger/factory';
import { getQueueConnection } from './connection';

const WEBHOOK_QUEUE_NAME = 'webhook';
const WEBHOOK_DISPATCH_TIMEOUT_MS = 30_000;

export type WebhookJobData = {
  url: string;
  secret: string;
  payload: Record<string, unknown>;
};

export type WebhookJobName = 'webhook:send';

/**
 * Consumes the `webhook` queue produced by `dispatchWebhook` in
 * @herafino/shared/services. The job payload is `{ url, secret, payload }`
 * where `payload.event` is the event name.
 */
export function createWebhookWorker(): Worker<WebhookJobData> {
  const worker = new Worker<WebhookJobData>(
    WEBHOOK_QUEUE_NAME,
    async (job) => {
      const { url, secret, payload } = job.data;
      const event = String(payload.event ?? '');

      if (!url || typeof url !== 'string') {
        throw new Error(`Invalid webhook URL for job ${job.id}`);
      }

      const timestamp = new Date().toISOString();
      const signaturePayload = `${event}:${timestamp}:${secret}:${JSON.stringify(payload)}`;
      const signature = Buffer.from(signaturePayload).toString('base64');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_DISPATCH_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-HeRaFiNo-Event': event,
            'X-HeRaFiNo-Timestamp': timestamp,
            'X-HeRaFiNo-Signature-Hmac-Sha256': signature,
          },
          body: JSON.stringify({ event, timestamp, signature, payload }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => '(unable to read response body)');
          throw new Error(
            `Webhook returned ${response.status} ${response.statusText}: ${body.slice(0, 500)}`
          );
        }

        logger.info(
          { jobId: job.id, url, event, status: response.status },
          'Webhook dispatched successfully'
        );
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      connection: getQueueConnection(),
      concurrency: parseInt(process.env.WORKER_WEBHOOK_CONCURRENCY || '10', 10),
      limiter: {
        max: parseInt(process.env.WORKER_WEBHOOK_RATE_LIMIT || '100', 10),
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(
      { jobId: job.id?.toString(), queue: WEBHOOK_QUEUE_NAME },
      'Webhook worker job completed'
    );
  });

  worker.on('failed', (_job, err) => {
    logger.error(
      { component: 'webhook-worker', error: err.message },
      'Webhook worker job failed'
    );
  });

  worker.on('error', (err: Error) => {
    logger.error({ component: 'webhook-worker', error: err.message }, 'Webhook worker error');
  });

  return worker;
}
