import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@herafino/shared/http/error-handler';
import { auth } from '@/app/auth';
import { ReviewRepository } from '@herafino/shared/repositories/review.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { OrderRepository } from '@herafino/shared/repositories/order.repository';
import { logger } from '@herafino/shared/logger/factory';
import { ReviewCreateSchema } from '@herafino/shared/validation/review.schema';
import type { ID } from '@herafino/types';

const reviewRepository = new ReviewRepository(new OutboxRepository());
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

export async function POST(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    if (session.user.role !== 'client') {
      return NextResponse.json({ error: 'Only clients can create reviews' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ReviewCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message?: string }) => e.message || 'Validation error').join(', ') },
        { status: 400 }
      );
    }

    const order = await orderRepository.findById(parsed.data.orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'completed') {
      return NextResponse.json({ error: 'Order must be completed to leave a review' }, { status: 400 });
    }

    const existingReview = await reviewRepository.findByOrderId(parsed.data.orderId);
    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists for this order' }, { status: 409 });
    }

    const review = await reviewRepository.create({
      orderId: parsed.data.orderId,
      clientId: session.user.id,
      craftsmanId: order.craftsmanId!,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'POST /api/reviews failed');
    return createErrorResponse(error);
  }
}
