import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@herafino/shared/http/error-handler';
import { auth } from '@/app/auth';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { logger } from '@herafino/shared/logger/factory';
import { OrderCreateSchema } from '@herafino/shared/validation';
import { enqueueOrderTimeoutCheck } from '@herafino/shared/services';
import type { ID } from '@herafino/types';

const orderRepository = new OrderRepository(new OutboxRepository());
const userRepository = new UserRepository();
const craftsmanRepository = new CraftsmanRepository();

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

export async function GET() {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const userId = session.user.id;
    const role = session.user.role;

    let orders;
    if (role === 'craftsman') {
      orders = await orderRepository.findByCraftsmanId(userId);
    } else {
      orders = await orderRepository.findByClientId(userId);
    }

    return NextResponse.json({ data: orders });
  } catch (error) {
    logger.error({ error }, 'GET /api/orders failed');
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    if (session.user.role !== 'client') {
      return NextResponse.json({ error: 'Only clients can create orders' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = OrderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message?: string }) => e.message || 'Validation error').join(', ') },
        { status: 400 }
      );
    }

    const craftsman = await craftsmanRepository.findProfileById(parsed.data.craftsmanId);
    if (!craftsman) {
      return NextResponse.json({ error: 'Craftsman not found' }, { status: 404 });
    }

    const client = await userRepository.findById(session.user.id);
    if (!client) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const order = await orderRepository.create({
      clientId: session.user.id,
      craftsmanId: parsed.data.craftsmanId,
      craftType: parsed.data.craftType,
      description: parsed.data.description,
      address: parsed.data.address,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      estimatedPrice: parsed.data.estimatedPrice,
    });

    const timeoutAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await enqueueOrderTimeoutCheck(order.id, timeoutAt);
    logger.info({ orderId: order.id, timeoutAt: timeoutAt.toISOString() }, 'Order timeout check scheduled');

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'POST /api/orders failed');
    return createErrorResponse(error);
  }
}
