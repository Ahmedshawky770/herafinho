import { z } from 'zod';

const OnboardingSchema = z.object({
  craftType: z.enum(['carpenter', 'plumber', 'painter', 'electrician', 'welder', 'tiler', 'ceramicist', 'whitewasher', 'hvac', 'satellite', 'aluminum']),
  experienceYears: z.number().min(0),
  idCardFrontUrl: z.string().url(),
  idCardBackUrl: z.string().url(),
  facePhotoUrl: z.string().url(),
  transportType: z.enum(['bike', 'walking', 'car', 'minivan']),
  transportPhotos: z.array(z.string().url()).optional(),
  vehicleNumber: z.string().optional(),
  workshopAddress: z.string(),
  workshopLatitude: z.string(),
  workshopLongitude: z.string(),
});

export { OnboardingSchema };