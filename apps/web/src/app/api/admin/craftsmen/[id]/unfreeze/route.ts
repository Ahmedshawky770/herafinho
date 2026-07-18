import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const craftsmanRepository = new CraftsmanRepository(new OutboxRepository());

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAdmin(session);

    const { id } = await params;
    const updated = await craftsmanRepository.unfreeze(id, session.user.id);

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    logger.error({ error }, 'POST /api/admin/craftsmen/[id]/unfreeze failed');
    return createErrorResponse(error);
  }
}
