import type { ID, NewReview, Review } from "@herafino/types";
import type { IReviewRepository } from "@herafino/contracts";
import { eq } from "drizzle-orm";
import { logger } from "../logger/factory";
import { db } from "../db";
import { reviews } from "../db/schema";
import type { DomainEvent } from "@herafino/types";
import { OutboxRepository } from "../events/outbox-repository";

function toDomain(review: typeof reviews.$inferSelect): Review {
  return {
    ...review,
    comment: review.comment ?? undefined,
  };
}

function buildEvent(
  event: Omit<DomainEvent, "id" | "metadata"> & { metadata: DomainEvent["metadata"] }
): DomainEvent {
  return { id: crypto.randomUUID(), ...event };
}

export class ReviewRepository implements IReviewRepository {
  constructor(private readonly outbox?: OutboxRepository) {}

  private async appendOutbox(event: DomainEvent): Promise<void> {
    if (this.outbox) {
      await this.outbox.append(event);
    }
  }

  async findById(id: ID): Promise<Review | null> {
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, id),
    });
    return review ? toDomain(review) : null;
  }

  async findByOrderId(orderId: ID): Promise<Review | null> {
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.orderId, orderId),
    });
    return review ? toDomain(review) : null;
  }

  async findByCraftsmanId(craftsmanId: ID): Promise<Review[]> {
    const result = await db.query.reviews.findMany({
      where: eq(reviews.craftsmanId, craftsmanId),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
    return result.map(toDomain);
  }

  async findByClientId(clientId: ID): Promise<Review[]> {
    const result = await db.query.reviews.findMany({
      where: eq(reviews.clientId, clientId),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
    return result.map(toDomain);
  }

  async create(review: NewReview): Promise<Review> {
    const [created] = await db.insert(reviews).values(review).returning();
    logger.info({ reviewId: created.id, orderId: created.orderId }, "Review created");
    await this.appendOutbox(
      buildEvent({
        name: "review.created",
        payload: {
          reviewId: created.id,
          orderId: created.orderId,
          clientId: created.clientId,
          craftsmanId: created.craftsmanId,
          rating: created.rating,
        },
        metadata: { occurredAt: new Date() },
      })
    );
    return toDomain(created);
  }

  async calculateAverageRating(craftsmanId: ID): Promise<number> {
    const result = await db.query.reviews.findMany({
      where: eq(reviews.craftsmanId, craftsmanId),
      columns: { rating: true },
    });
    if (result.length === 0) return 0;
    const sum = result.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / result.length) * 100) / 100;
  }

  async countByCraftsman(craftsmanId: ID): Promise<number> {
    const result = await db.query.reviews.findMany({
      where: eq(reviews.craftsmanId, craftsmanId),
      columns: { id: true },
    });
    return result.length;
  }
}
