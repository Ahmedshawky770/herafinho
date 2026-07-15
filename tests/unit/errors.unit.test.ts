import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  createErrorResponse,
} from '@herafino/shared/errors/app-error';

describe('AppError hierarchy', () => {
  it('AppError carries statusCode and code', () => {
    const err = new AppError('boom', 418, 'TEAPOT');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
  });

  it('NotFoundError defaults to 404 / NOT_FOUND', () => {
    const err = new NotFoundError('Craftsman');
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Craftsman not found');
  });

  it('UnauthorizedError defaults to 401 / UNAUTHORIZED', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('ForbiddenError defaults to 403 / FORBIDDEN', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('ConflictError uses the provided message with 409 / CONFLICT', () => {
    const err = new ConflictError('already exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('already exists');
  });

  it('ValidationError defaults to 400 / VALIDATION_ERROR', () => {
    const err = new ValidationError('invalid');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});

describe('createErrorResponse', () => {
  it('maps an AppError to a structured payload', () => {
    const res = createErrorResponse(new NotFoundError('Order'));
    expect(res).toEqual({
      error: 'Order not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });

  it('maps an unknown error to a 500 internal payload', () => {
    const res = createErrorResponse(new Error('weird'));
    expect(res).toEqual({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    });
  });
});
