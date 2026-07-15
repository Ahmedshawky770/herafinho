import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { ReviewRepository } from '@herafino/shared/repositories/review.repository';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const reviewRepository = new ReviewRepository();
const orderRepository = new OrderRepository();

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
    const reviews = await reviewRepository.findByCraftsmanId(id);

    const enriched = await Promise.all(
      reviews.map(async (review) => {
        const order = await orderRepository.findById(review.orderId);
        return {
          ...review,
          orderDescription: order?.description ?? undefined,
          orderStatus: order?.status ?? undefined,
        };
      })
    );

    return NextResponse.json({ data: enriched });
  } catch (error) {
    logger.error({ error }, 'GET /api/reviews/craftsman/[id] failed');
    return createErrorResponse(error);
  }
}
