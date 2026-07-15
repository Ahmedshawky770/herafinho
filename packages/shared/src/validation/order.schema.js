import { z } from 'zod';
const OrderCreateSchema = z.object({
    craftsmanId: z.string().uuid(),
    craftType: z.enum(['carpenter', 'plumber', 'painter', 'electrician', 'welder', 'tiler', 'ceramicist', 'whitewasher', 'hvac', 'satellite', 'aluminum']),
    description: z.string().min(10),
    address: z.string().min(5),
    latitude: z.string(),
    longitude: z.string(),
    estimatedPrice: z.string().optional(),
    scheduledAt: z.date().optional(),
});
export { OrderCreateSchema };
