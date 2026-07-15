import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const orderRepository = new OrderRepository(new OutboxRepository());

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const { id } = await params;
    const order = await orderRepository.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role === 'client' && order.clientId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'craftsman' && order.craftsmanId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['pending', 'accepted'].includes(order.status)) {
      return NextResponse.json({ error: 'Order must be pending or accepted to cancel' }, { status: 400 });
    }

    const updated = await orderRepository.cancel(id, userId);
    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/orders/[id]/cancel failed');
    return createErrorResponse(error);
  }
}
