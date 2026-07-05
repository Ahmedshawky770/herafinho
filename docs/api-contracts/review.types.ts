import { z } from 'zod';

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  clientId: z.string().uuid(),
  craftsmanId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
  createdAt: z.date(),
});

export const NewReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type Review = z.infer<typeof ReviewSchema>;
export type NewReview = z.infer<typeof NewReviewSchema>;