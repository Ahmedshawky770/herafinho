import { z } from 'zod';
const ReviewCreateSchema = z.object({
    orderId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
});
export { ReviewCreateSchema };
