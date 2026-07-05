import type { ID, OrderStatus, User } from './user.types';

export type { ID, OrderStatus, User };

export interface Order {
  id: ID;
  clientId: ID;
  craftsmanId?: ID;
  craftType: string;
  status: OrderStatus;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  estimatedPrice?: string;
  finalPrice?: string;
  scheduledAt?: Date;
  completedAt?: Date;
  clientAcceptedFinalPrice?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewOrder {
  clientId: ID;
  craftsmanId?: ID;
  craftType: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  estimatedPrice?: string;
}
