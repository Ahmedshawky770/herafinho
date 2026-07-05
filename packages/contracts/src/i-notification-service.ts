import type { ID, NewNotification, Notification } from '@herafino/types';

export interface INotificationService {
  send(notification: NewNotification): Promise<Notification>;
  sendBatch(notifications: NewNotification[]): Promise<Notification[]>;
  markAsRead(id: ID, userId: ID): Promise<void>;
  getUnread(userId: ID): Promise<Notification[]>;
  getByUserId(userId: ID, limit?: number): Promise<Notification[]>;
}