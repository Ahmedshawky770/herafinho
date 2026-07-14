import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@herafino/shared/http/error-handler';
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

    if (session.user.role !== 'craftsman') {
      return NextResponse.json({ error: 'Only craftsmen can complete orders' }, { status: 403 });
    }

    const { id } = await params;
    const order = await orderRepository.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.craftsmanId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const finalPrice = typeof body.finalPrice === 'string' ? body.finalPrice : undefined;

    if (order.status !== 'in_progress' && order.status !== 'accepted') {
      return NextResponse.json({ error: 'Order must be accepted or in progress to complete' }, { status: 400 });
    }

    if (!finalPrice) {
      return NextResponse.json({ error: 'finalPrice is required to complete an order' }, { status: 400 });
    }

    await orderRepository.updateStatus(id, 'completed');
    const updated = await orderRepository.update(id, { finalPrice });
    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/orders/[id]/complete failed');
    return createErrorResponse(error);
  }
}
