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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const { id } = await params;
    const notification = await notificationRepository.findById(id, session.user.id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ data: notification });
  } catch (error) {
    logger.error({ error }, 'GET /api/notifications/[id] failed');
    return createErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const { id } = await params;
    const notification = await notificationRepository.findById(id, session.user.id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    const updated = await notificationRepository.markAsRead(id, session.user.id);
    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/notifications/[id] failed');
    return createErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const { id } = await params;
    const notification = await notificationRepository.findById(id, session.user.id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await notificationRepository.delete(id);
    return NextResponse.json({ data: null }, { status: 204 });
  } catch (error) {
    logger.error({ error }, 'DELETE /api/notifications/[id] failed');
    return createErrorResponse(error);
  }
}
