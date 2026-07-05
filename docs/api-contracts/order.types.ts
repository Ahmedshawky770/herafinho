import { z } from 'zod';
import { CraftTypeSchema } from './craftsman.types';

export const OrderStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled']);

export const OrderSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  craftsmanId: z.string().uuid().optional().nullable(),
  craftType: CraftTypeSchema,
  status: OrderStatusSchema.default('pending'),
  description: z.string(),
  address: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  estimatedPrice: z.string().optional().nullable(),
  finalPrice: z.string().optional().nullable(),
  scheduledAt: z.date().optional().nullable(),
  completedAt: z.date().optional().nullable(),
  clientAcceptedFinalPrice: z.boolean().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const NewOrderSchema = z.object({
  craftsmanId: z.string().uuid(),
  craftType: CraftTypeSchema,
  description: z.string(),
  address: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  estimatedPrice: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type NewOrder = z.infer<typeof NewOrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;