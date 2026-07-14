import type { DomainEvent, ID, OutboxMessage } from '@herafino/types';

export interface IOutboxRepository {
  append(event: DomainEvent): Promise<void>;
  getPending(limit: number): Promise<OutboxMessage[]>;
  markCompleted(id: ID): Promise<void>;
  markFailed(id: ID, error: string): Promise<void>;
  cleanup(maxAgeDays: number): Promise<number>;
}
