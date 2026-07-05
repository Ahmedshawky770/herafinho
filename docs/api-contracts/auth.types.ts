import { z } from 'zod';
import { UserRoleSchema } from './craftsman.types';

export const SessionSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  image: z.string(),
  role: UserRoleSchema,
  googleId: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export const HarfinoSession = SessionSchema;

export type HarfinoSession = z.infer<typeof SessionSchema>;