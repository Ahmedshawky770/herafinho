import { NextResponse } from 'next/server';
import { AppError, createErrorResponse as toErrorPayload } from '@herafino/shared/errors/app-error';

export { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, ValidationError } from '@herafino/shared/errors/app-error';

export function createErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    const payload = toErrorPayload(error);
    return NextResponse.json({ error: payload.error, code: payload.code }, { status: payload.statusCode });
  }
  return NextResponse.json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' }, { status: 500 });
}
