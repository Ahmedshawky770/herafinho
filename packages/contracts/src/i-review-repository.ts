import type { ID, NewReview, Review } from '@herafino/types';

export interface IReviewRepository {
  findById(id: ID): Promise<Review | null>;
  findByOrderId(orderId: ID): Promise<Review | null>;
  findByCraftsmanId(craftsmanId: ID): Promise<Review[]>;
  findByClientId(clientId: ID): Promise<Review[]>;
  create(review: NewReview): Promise<Review>;
  calculateAverageRating(craftsmanId: ID): Promise<number>;
  countByCraftsman(craftsmanId: ID): Promise<number>;
}
