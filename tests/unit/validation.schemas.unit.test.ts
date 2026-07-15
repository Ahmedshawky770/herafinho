// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { OrderCreateSchema } from '@herafino/shared/validation/order.schema';
import { ComplaintCreateSchema } from '@herafino/shared/validation/complaint.schema';
import { OnboardingSchema } from '@herafino/shared/validation/onboarding.schema';
import { UpdateLocationSchema } from '@herafino/shared/validation/location.schema';
import { ReviewCreateSchema } from '@herafino/shared/validation/review.schema';

const UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('OrderCreateSchema', () => {
  const base = {
    craftsmanId: UUID,
    craftType: 'carpenter',
    description: 'Fix the leaking kitchen sink pipe',
    address: '12 Tahrir St',
    latitude: '30.0444',
    longitude: '31.2357',
  };

  it('accepts a valid order payload', () => {
    expect(OrderCreateSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a non-uuid craftsmanId', () => {
    expect(OrderCreateSchema.safeParse({ ...base, craftsmanId: 'not-uuid' }).success).toBe(false);
  });

  it('rejects an unknown craftType', () => {
    expect(OrderCreateSchema.safeParse({ ...base, craftType: 'astronaut' }).success).toBe(false);
  });

  it('rejects a description shorter than 10 chars', () => {
    expect(OrderCreateSchema.safeParse({ ...base, description: 'short' }).success).toBe(false);
  });

  it('rejects an address shorter than 5 chars', () => {
    expect(OrderCreateSchema.safeParse({ ...base, address: 'abc' }).success).toBe(false);
  });

  it('rejects a numeric latitude (must be a string)', () => {
    expect(OrderCreateSchema.safeParse({ ...base, latitude: 30.0444 }).success).toBe(false);
  });

  it('allows optional estimatedPrice and scheduledAt', () => {
    const result = OrderCreateSchema.safeParse({
      ...base,
      estimatedPrice: '250',
      scheduledAt: new Date('2026-08-01T10:00:00Z'),
    });
    expect(result.success).toBe(true);
  });
});

describe('ComplaintCreateSchema', () => {
  const base = {
    againstUserId: UUID,
    reason: 'no_show',
    description: 'The craftsman never showed up',
  };

  it('accepts a valid complaint', () => {
    expect(ComplaintCreateSchema.safeParse(base).success).toBe(true);
  });

  it('allows an optional orderId', () => {
    expect(ComplaintCreateSchema.safeParse({ ...base, orderId: UUID }).success).toBe(true);
  });

  it('rejects a missing againstUserId', () => {
    const { againstUserId, ...rest } = base;
    expect(ComplaintCreateSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects an unknown reason', () => {
    expect(ComplaintCreateSchema.safeParse({ ...base, reason: 'evil' }).success).toBe(false);
  });

  it('rejects a description shorter than 10 chars', () => {
    expect(ComplaintCreateSchema.safeParse({ ...base, description: 'bad' }).success).toBe(false);
  });

  it('rejects non-url evidenceUrls', () => {
    expect(
      ComplaintCreateSchema.safeParse({ ...base, evidenceUrls: ['not-a-url'] }).success
    ).toBe(false);
  });
});

describe('OnboardingSchema', () => {
  const base = {
    craftType: 'plumber',
    experienceYears: 5,
    idCardFrontUrl: 'https://cdn.example.com/front.jpg',
    idCardBackUrl: 'https://cdn.example.com/back.jpg',
    facePhotoUrl: 'https://cdn.example.com/face.jpg',
    transportType: 'car',
    workshopAddress: '5 Pyramids Rd',
    workshopLatitude: '29.9792',
    workshopLongitude: '31.1342',
  };

  it('accepts a valid onboarding payload', () => {
    expect(OnboardingSchema.safeParse(base).success).toBe(true);
  });

  it('rejects negative experienceYears', () => {
    expect(OnboardingSchema.safeParse({ ...base, experienceYears: -1 }).success).toBe(false);
  });

  it('rejects an unknown transportType', () => {
    expect(OnboardingSchema.safeParse({ ...base, transportType: 'spaceship' }).success).toBe(false);
  });

  it('rejects a non-url idCardFrontUrl', () => {
    expect(OnboardingSchema.safeParse({ ...base, idCardFrontUrl: '/local/path' }).success).toBe(false);
  });

  it('allows optional transportPhotos and vehicleNumber', () => {
    const result = OnboardingSchema.safeParse({
      ...base,
      transportPhotos: ['https://cdn.example.com/t1.jpg'],
      vehicleNumber: 'ABC-123',
    });
    expect(result.success).toBe(true);
  });
});

describe('UpdateLocationSchema', () => {
  const base = { latitude: '30.0', longitude: '31.0', isAvailable: true };

  it('accepts a valid location update', () => {
    expect(UpdateLocationSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a missing isAvailable flag', () => {
    const { isAvailable, ...rest } = base;
    expect(UpdateLocationSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects a non-boolean isAvailable', () => {
    expect(UpdateLocationSchema.safeParse({ ...base, isAvailable: 'yes' }).success).toBe(false);
  });
});

describe('ReviewCreateSchema', () => {
  const base = { orderId: UUID, rating: 4, comment: 'great' };

  it('accepts a valid 1-5 rating', () => {
    expect(ReviewCreateSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a rating below 1', () => {
    expect(ReviewCreateSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
  });

  it('rejects a rating above 5', () => {
    expect(ReviewCreateSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
  });

  it('rejects a non-uuid orderId', () => {
    expect(ReviewCreateSchema.safeParse({ ...base, orderId: 'nope' }).success).toBe(false);
  });

  it('makes comment optional', () => {
    expect(ReviewCreateSchema.safeParse({ orderId: UUID, rating: 3 }).success).toBe(true);
  });
});
