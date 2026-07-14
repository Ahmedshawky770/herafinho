import { z } from 'zod';

const ComplaintCreateSchema = z.object({
  orderId: z.string().uuid().optional(),
  againstUserId: z.string().uuid(),
  reason: z.enum(['no_show', 'bad_service', 'overpriced', 'harassment', 'fraud', 'other']),
  description: z.string().min(10),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export { ComplaintCreateSchema };