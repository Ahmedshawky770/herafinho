import type { ID, OrderStatus, User, CraftType } from './user.types';

export type { ID, OrderStatus, User, CraftType };

export interface Order {
  id: ID;
  clientId: ID;
  craftsmanId?: ID;
  craftType: CraftType;
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
  craftType: CraftType;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  estimatedPrice?: string;
}
