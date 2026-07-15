import { Queue, Worker } from 'bullmq';
import { logger } from '../logger/factory';
import { getQueueConnection } from './connection';

export const EMAIL_QUEUE_NAME = 'herafino-emails';
const MAX_EMAIL_RETRIES = 3;

export type EmailJobData = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailJobName = 'email:send';

/** Minimal contract the email worker needs; providers (Resend, etc.) supply it. */
export interface EmailServiceLike {
  send(to: string, subject: string, html: string, text: string): Promise<void>;
}

export function createEmailQueue(): Queue<EmailJobData> {
  return new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: MAX_EMAIL_RETRIES,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    },
  });
}

export function createEmailWorker(emailService: EmailServiceLike): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      const { to, subject, html, text } = job.data;
      logger.info({ jobId: String(job.id), to, subject }, 'Processing email job');
      await emailService.send(to, subject, html, text);
      logger.info({ jobId: String(job.id), to }, 'Email job completed');
    },
    {
      connection: getQueueConnection(),
      concurrency: parseInt(process.env.WORKER_EMAIL_CONCURRENCY || '10', 10),
      limiter: {
        max: parseInt(process.env.WORKER_EMAIL_RATE_LIMIT || '50', 10),
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(
      { jobId: job.id?.toString(), queue: EMAIL_QUEUE_NAME },
      'Email worker job completed'
    );
  });

  worker.on('failed', (job, err) => {
    logger.error(
      {
        component: 'email-worker',
        jobId: typeof job === 'object' && job ? job.id?.toString() : undefined,
        queue: EMAIL_QUEUE_NAME,
        error: err.message,
      },
      'Email worker job failed'
    );
  });

  worker.on('error', (err: Error) => {
    logger.error({ component: 'email-worker', error: err.message }, 'Email worker error');
  });

  return worker;
}
