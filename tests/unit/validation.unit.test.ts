// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { ReviewCreateSchema } from '@herafino/shared/validation/review.schema';

describe('ReviewCreateSchema', () => {
  it('accepts a valid 1-5 rating', () => {
    const result = ReviewCreateSchema.safeParse({
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      rating: 4,
      comment: 'great',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a rating below 1', () => {
    const result = ReviewCreateSchema.safeParse({
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a rating above 5', () => {
    const result = ReviewCreateSchema.safeParse({
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      rating: 6,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-uuid orderId', () => {
    const result = ReviewCreateSchema.safeParse({
      orderId: 'not-a-uuid',
      rating: 3,
    });
    expect(result.success).toBe(false);
  });

  it('makes comment optional', () => {
    const result = ReviewCreateSchema.safeParse({
      orderId: '123e4567-e89b-12d3-a456-426614174000',
      rating: 5,
    });
    expect(result.success).toBe(true);
  });
});
