import { NextResponse } from 'next/server';
import { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError } from '@herafino/shared/errors/app-error';

export { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError };

export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
  }
  return NextResponse.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, { status: 500 });
}