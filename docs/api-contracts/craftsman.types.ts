import { z } from 'zod';

export const CraftTypeSchema = z.enum([
  'carpenter', 'plumber', 'painter', 'electrician',
  'welder', 'tiler', 'ceramicist', 'whitewasher',
  'hvac', 'satellite', 'aluminum'
]);

export const TransportTypeSchema = z.enum(['bike', 'walking', 'car', 'minivan']);

export const UserRoleSchema = z.enum(['client', 'craftsman', 'admin', 'super_admin']);

export type CraftType = z.infer<typeof CraftTypeSchema>;
export type TransportType = z.infer<typeof TransportTypeSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  name: z.string(),
  image: z.string(),
  googleId: z.string().optional(),
  role: UserRoleSchema.default('client'),
  phone: z.string().optional(),
  age: z.number().int().optional(),
  bannedAt: z.date().optional().nullable(),
  isDeleted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CraftsmanProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  craftType: CraftTypeSchema,
  experienceYears: z.number().int().min(0).max(50),
  idCardFrontUrl: z.string().url(),
  idCardBackUrl: z.string().url(),
  facePhotoUrl: z.string().url(),
  transportType: TransportTypeSchema,
  transportPhotos: z.array(z.string().url()).optional(),
  vehicleNumber: z.string().optional(),
  workshopAddress: z.string().min(10),
  workshopLatitude: z.string(),
  workshopLongitude: z.string(),
  isAvailable: z.boolean().default(false),
  isOnline: z.boolean().default(false),
  status: z.enum(['pending', 'approved', 'rejected', 'frozen']).default('pending'),
  freezeUntil: z.date().optional().nullable(),
  freezeReason: z.string().optional().nullable(),
  freezeCount: z.number().int().default(0),
  rejectionReason: z.string().optional().nullable(),
  reviewedBy: z.string().optional().nullable(),
  reviewedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
export type CraftsmanProfile = z.infer<typeof CraftsmanProfileSchema>;