import type { ID, NotificationType } from './user.types';

export type { ID, NotificationType };

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  readAt?: Date;
  sentAt: Date;
}

export interface NewNotification {
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
}
