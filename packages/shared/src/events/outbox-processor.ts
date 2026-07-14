import { OutboxRepository } from './outbox-repository';
import { ValkeyEventBus } from './valkey-event-bus';
import { logger } from '../logger/factory';
import type { EventHandler } from '@herafino/contracts';

export class OutboxProcessor {
  private readonly outboxRepository: OutboxRepository;
  private readonly eventBus: ValkeyEventBus;
  private readonly eventHandlers: Map<string, EventHandler[]>;
  private running = false;
  private pollInterval = 1000;

  constructor(
    outboxRepository: OutboxRepository,
    eventBus: ValkeyEventBus,
    eventHandlers: Map<string, EventHandler[]>,
    pollInterval = 1000
  ) {
    this.outboxRepository = outboxRepository;
    this.eventBus = eventBus;
    this.eventHandlers = eventHandlers;
    this.pollInterval = pollInterval;
  }

  async start(): Promise<void> {
    this.running = true;
    logger.info('Outbox processor started');

    for (const [eventName, handlers] of this.eventHandlers) {
      await this.eventBus.subscribe(eventName, async (payload) => {
        for (const handler of handlers) {
          try {
            await handler.handle({ name: eventName, payload: payload as Record<string, unknown> });
          } catch (error) {
            logger.error(
              { eventName, error: error instanceof Error ? error.message : String(error) },
              'Event handler error'
            );
          }
        }
      });
    }

    while (this.running) {
      try {
        await this.processPendingEvents();
      } catch (error) {
        logger.error({ error }, 'Outbox processing error');
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    logger.info('Outbox processor stopped');
  }

  private async processPendingEvents(): Promise<void> {
    const events = await this.outboxRepository.getPending(50);
    for (const event of events) {
      try {
        await this.eventBus.publish({ name: event.eventName, payload: event.payload, metadata: event.metadata, id: event.id });
        await this.outboxRepository.markCompleted(event.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error({ eventId: event.id, error: message }, 'Failed to process outbox event');
        await this.outboxRepository.markFailed(event.id, message);
      }
    }
  }
}
