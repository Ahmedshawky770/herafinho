import { z } from 'zod';

export const ComplaintReasonSchema = z.enum(['no_show', 'bad_service', 'overpriced', 'harassment', 'fraud', 'other']);
export const ComplaintStatusSchema = z.enum(['pending', 'investigating', 'resolved', 'dismissed']);
export const ModerationActionSchema = z.enum(['warning', 'freeze', 'permanent_ban']);

export const ComplaintSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid().optional().nullable(),
  reporterId: z.string().uuid(),
  againstUserId: z.string().uuid(),
  reason: ComplaintReasonSchema,
  description: z.string(),
  evidenceUrls: z.array(z.string().url()).optional(),
  status: ComplaintStatusSchema.default('pending'),
  actionTaken: ModerationActionSchema.optional().nullable(),
  resolvedBy: z.string().uuid().optional().nullable(),
  resolvedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const NewComplaintSchema = z.object({
  orderId: z.string().uuid().optional(),
  againstUserId: z.string().uuid(),
  reason: ComplaintReasonSchema,
  description: z.string(),
  evidenceUrls: z.array(z.string().url()).optional(),
});

export type Complaint = z.infer<typeof ComplaintSchema>;
export type NewComplaint = z.infer<typeof NewComplaintSchema>;
export type ComplaintReason = z.infer<typeof ComplaintReasonSchema>;
export type ComplaintStatus = z.infer<typeof ComplaintStatusSchema>;
export type ModerationAction = z.infer<typeof ModerationActionSchema>;