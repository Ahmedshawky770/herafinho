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

export async function GET(
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

    return NextResponse.json({ data: order });
  } catch (error) {
    logger.error({ error }, 'GET /api/orders/[id] failed');
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
    const order = await orderRepository.findById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const body = await request.json();

    if (role === 'client') {
      if (order.clientId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (body.clientAcceptedFinalPrice !== undefined) {
        if (order.status !== 'completed') {
          return NextResponse.json({ error: 'Order must be completed to accept final price' }, { status: 400 });
        }
        const updated = await orderRepository.update(id, { clientAcceptedFinalPrice: body.clientAcceptedFinalPrice });
        return NextResponse.json({ data: updated });
      }

      return NextResponse.json({ error: 'Invalid update for client' }, { status: 400 });
    }

    if (role === 'craftsman') {
      if (order.craftsmanId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (body.finalPrice !== undefined) {
        if (order.status !== 'completed') {
          return NextResponse.json({ error: 'Order must be completed to set final price' }, { status: 400 });
        }
        const updated = await orderRepository.update(id, { finalPrice: body.finalPrice });
        return NextResponse.json({ data: updated });
      }

      return NextResponse.json({ error: 'Invalid update for craftsman' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/orders/[id] failed');
    return createErrorResponse(error);
  }
}
