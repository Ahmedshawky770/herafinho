import { NextResponse } from 'next/server';
import { ForbiddenError, NotFoundError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { applyBanCascade } from '@herafino/shared/services/moderation.service';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const craftsmanRepository = new CraftsmanRepository(new OutboxRepository());
const userRepository = new UserRepository();

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
    const session = (await auth()) as AuthSession | null;
    requireAdmin(session);

    const { id } = await params;

    const profile = await craftsmanRepository.findProfileById(id);
    if (!profile) {
      throw new NotFoundError('Craftsman profile');
    }

    await craftsmanRepository.ban(id, session.user.id);
    await applyBanCascade(userRepository, profile.userId, profile.id, profile.freezeCount, 'permanent_ban', session.user.id);

    return NextResponse.json({ data: { banned: true } }, { status: 200 });
  } catch (error) {
    logger.error({ error }, 'POST /api/admin/craftsmen/[id]/ban failed');
    return createErrorResponse(error);
  }
}
