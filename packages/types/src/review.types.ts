import type { ID } from './user.types';

export type { ID };

export interface Review {
  id: ID;
  orderId: ID;
  clientId: ID;
  craftsmanId: ID;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface NewReview {
  orderId: ID;
  clientId: ID;
  craftsmanId: ID;
  rating: number;
  comment?: string;
}
