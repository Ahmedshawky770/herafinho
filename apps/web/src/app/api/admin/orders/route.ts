import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const orderRepository = new OrderRepository(new OutboxRepository());
const userRepository = new UserRepository();
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

export async function GET(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAdmin(session);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null;

    let orders;
    if (status && ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      orders = await orderRepository.findAll().then((all) =>
        all.filter((order) => order.status === status)
      );
    } else {
      orders = await orderRepository.findAll();
    }

    const enriched = await Promise.all(
      orders.map(async (order) => {
        const client = await userRepository.findById(order.clientId);
        const craftsmanUser = order.craftsmanId ? await userRepository.findById(order.craftsmanId) : null;
        const craftsmanProfile = order.craftsmanId
          ? await craftsmanRepository.findProfileByUserId(order.craftsmanId)
          : null;
        return {
          ...order,
          client: client ? { id: client.id, name: client.name, email: client.email } : null,
          craftsman: craftsmanUser
            ? { id: craftsmanProfile?.id || craftsmanUser.id, name: craftsmanUser.name, craftType: craftsmanProfile?.craftType }
            : null,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/orders failed');
    return createErrorResponse(error);
  }
}
