import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@herafino/shared/http/error-handler';
import { auth } from '@/app/auth';
import { NotificationRepository } from '@herafino/shared/repositories/notification.repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const notificationRepository = new NotificationRepository();

interface AuthSession {
  user?: {
    id?: ID;
    role?: string;
  };
}

function requireAuth(session: AuthSession | null): asserts session is { user: { id: ID; role: string } } {
  if (!session?.user?.id) {
    throw new UnauthorizedError('Unauthorized');
  }
}

export async function GET(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 100);
    const unreadOnly = url.searchParams.get('unread') === 'true';

    const notifications = unreadOnly
      ? await notificationRepository.getUnread(session.user.id)
      : await notificationRepository.getByUserId(session.user.id, limit);

    return NextResponse.json({ data: notifications });
  } catch (error) {
    logger.error({ error }, 'GET /api/notifications failed');
    return createErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const body = await request.json();
    if (body.markAllRead === true) {
      await notificationRepository.markAllAsRead(session.user.id);
      return NextResponse.json({ data: { markedAllRead: true } });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/notifications failed');
    return createErrorResponse(error);
  }
}
