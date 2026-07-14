import type { ValkeyClient } from '../valkey/client';
import { logger } from '../logger/factory';
import type { DomainEvent } from '@herafino/types';

export class ValkeyEventBus {
  private readonly client: ValkeyClient;
  private started = false;
  private readonly subscriptions = new Map<string, (payload: unknown) => Promise<void>>();

  constructor(client: ValkeyClient) {
    this.client = client;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.client.on('message', (_channel: string, raw: string) => {
      for (const [eventName, handler] of this.subscriptions) {
        void (async () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.eventName === eventName) {
              await handler(parsed.payload);
            }
          } catch (err) {
            const errorMessage = typeof err === 'object' && err !== null && 'message' in err
              ? String((err as { message: unknown }).message)
              : typeof err === 'string'
                ? err
                : 'Unknown subscription error';
            logger.error({ error: errorMessage, eventName }, 'Failed to handle event');
          }
        })().catch((err) => {
          logger.error({ error: String(err) }, 'Async handler error');
        });
      }
    });
    logger.info('ValkeyEventBus started');
  }

  async stop(): Promise<void> {
    this.started = false;
    this.subscriptions.clear();
    logger.info('ValkeyEventBus stopped');
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.client.publish(`events:${event.name}`, JSON.stringify({ eventName: event.name, payload: event.payload }));
    logger.info({ eventName: event.name }, 'Event published');
  }

  subscribe(eventName: string, handler: (payload: unknown) => Promise<void>): void {
    this.subscriptions.set(eventName, handler);
    void this.client.subscribe(`events:${eventName}`).then(() => {
      logger.info({ eventName }, 'Subscribed to channel');
    }).catch((err) => {
      logger.error({ eventName, error: String(err) }, 'Subscription failed');
    });
  }
}
