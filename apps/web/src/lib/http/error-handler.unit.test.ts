import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createErrorResponse, AppError } from './error-handler';
import { NextResponse } from 'next/server';

describe('createErrorResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return formatted AppError response', async () => {
    class CustomError extends AppError {
      constructor() {
        super('Not Found', 404, 'NOT_FOUND');
      }
    }

    const response = createErrorResponse(new CustomError());
    expect(response).toBeDefined();
    expect(response.status).toBe(404);
  });

  it('should return 500 for unknown errors', async () => {
    const response = createErrorResponse(new Error('Something went wrong'));
    expect(response).toBeDefined();
    expect(response.status).toBe(500);
  });

  it('should return formatted error payload for AppError', async () => {
    class ValidationError extends AppError {
      constructor() {
        super('Validation failed', 400, 'VALIDATION_ERROR');
      }
    }

    const response = createErrorResponse(new ValidationError());
    const data = await (response as Response).json();
    expect(data.error).toBe('Validation failed');
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return INTERNAL_ERROR for unknown errors', async () => {
    const response = createErrorResponse(new Error('Unexpected'));
    const data = await (response as Response).json();
    expect(data.error).toBe('Internal Server Error');
    expect(data.code).toBe('INTERNAL_ERROR');
  });
});
