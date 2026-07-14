import type { ID } from './user.types';

export type EventName =
  | 'user.registered'
  | 'user.logged_in'
  | 'user.updated'
  | 'craftsman.registered'
  | 'craftsman.profile_updated'
  | 'craftsman.approved'
  | 'craftsman.rejected'
  | 'craftsman.frozen'
  | 'craftsman.unfrozen'
  | 'craftsman.banned'
  | 'craftsman.freeze_count_incremented'
  | 'order.created'
  | 'order.accepted'
  | 'order.rejected'
  | 'order.in_progress'
  | 'order.pending'
  | 'order.completed'
  | 'order.cancelled'
  | 'review.created'
  | 'complaint.filed'
  | 'complaint.investigating'
  | 'complaint.resolved'
  | 'complaint.dismissed'
  | 'admin.action_taken'
  | 'craftsman.location.updated'
  | 'craftsman.online_status.changed'
  | 'notification.sent';

export interface DomainEvent<T = unknown> {
  id: ID;
  name: EventName;
  payload: T;
  metadata: {
    actorId?: ID;
    correlationId?: ID;
    causationId?: ID;
    occurredAt: Date;
  };
}

export type OutboxMessage = {
  id: ID;
  eventName: EventName;
  payload: unknown;
  metadata: {
    actorId?: string;
    correlationId?: string;
    causationId?: string;
    occurredAt: Date;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  nextRetryAt: Date;
  lastError?: string;
  createdAt: Date;
  processedAt?: Date;
};
