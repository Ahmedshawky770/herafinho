import { z } from 'zod';

const UpdateLocationSchema = z.object({
  latitude: z.string(),
  longitude: z.string(),
  isAvailable: z.boolean(),
});

export { UpdateLocationSchema };