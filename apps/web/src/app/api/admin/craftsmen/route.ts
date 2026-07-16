import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID, CraftsmanStatus } from '@herafino/types';

const craftsmanRepository = new CraftsmanRepository();

interface AuthSession {
  user?: {
    id?: ID;
    role?: string;
  };
}

function requireAdmin(session: AuthSession | null): asserts session is { user: { id: ID; role: string } } {
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    throw new ForbiddenError('Forbidden');
  }
}

export async function GET(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAdmin(session);

    const url = new URL(request.url);
    const status = url.searchParams.get('status') as CraftsmanStatus | null;

    const profiles = await craftsmanRepository.findAll(status ?? undefined);
    return NextResponse.json({ data: profiles });
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/craftsmen failed');
    return createErrorResponse(error);
  }
}
