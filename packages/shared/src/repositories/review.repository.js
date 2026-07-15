import { eq } from 'drizzle-orm';
import { logger } from '../logger/factory';
import { db } from '../db';
import { reviews } from '../db/schema';
function toDomain(review) {
    return {
        ...review,
        comment: review.comment ?? undefined,
    };
}
function buildEvent(event) {
    return { id: crypto.randomUUID(), ...event };
}
export class ReviewRepository {
    outbox;
    constructor(outbox) {
        this.outbox = outbox;
    }
    async appendOutbox(event) {
        if (this.outbox) {
            await this.outbox.append(event);
        }
    }
    async findById(id) {
        const review = await db.query.reviews.findFirst({
            where: eq(reviews.id, id),
        });
        return review ? toDomain(review) : null;
    }
    async findByOrderId(orderId) {
        const review = await db.query.reviews.findFirst({
            where: eq(reviews.orderId, orderId),
        });
        return review ? toDomain(review) : null;
    }
    async findByCraftsmanId(craftsmanId) {
        const result = await db.query.reviews.findMany({
            where: eq(reviews.craftsmanId, craftsmanId),
            orderBy: (r, { desc }) => [desc(r.createdAt)],
        });
        return result.map(toDomain);
    }
    async create(review) {
        const [created] = await db.insert(reviews).values(review).returning();
        logger.info({ reviewId: created.id, orderId: created.orderId }, 'Review created');
        await this.appendOutbox(buildEvent({
            name: 'review.created',
            payload: {
                reviewId: created.id,
                orderId: created.orderId,
                clientId: created.clientId,
                craftsmanId: created.craftsmanId,
                rating: created.rating,
            },
            metadata: { occurredAt: new Date() },
        }));
        return toDomain(created);
    }
    async calculateAverageRating(craftsmanId) {
        const result = await db.query.reviews.findMany({
            where: eq(reviews.craftsmanId, craftsmanId),
            columns: { rating: true },
        });
        if (result.length === 0)
            return 0;
        const sum = result.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / result.length) * 100) / 100;
    }
    async countByCraftsman(craftsmanId) {
        const result = await db.query.reviews.findMany({
            where: eq(reviews.craftsmanId, craftsmanId),
            columns: { id: true },
        });
        return result.length;
    }
}
