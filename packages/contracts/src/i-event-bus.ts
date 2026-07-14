import type { DomainEvent, EventName } from '@herafino/types';
import type { EventHandler } from './i-event-handler';

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: EventName, handler: EventHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}
