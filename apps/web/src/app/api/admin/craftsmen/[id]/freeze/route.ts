import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@herafino/shared/http/error-handler';
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
  if (!session?.user || session.user.role !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const session = (await auth()) as AuthSession | null;
    requireAdmin(session);

    const { id } = await params;

    if (!body.reason || typeof body.reason !== 'string') {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    const freezeUntil = body.freezeUntil ? new Date(body.freezeUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = await craftsmanRepository.freeze(id, freezeUntil, body.reason, session.user.id);

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    logger.error({ error }, 'POST /api/admin/craftsmen/[id]/freeze failed');
    return createErrorResponse(error);
  }
}
