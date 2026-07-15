import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { ComplaintRepository } from '@herafino/shared/repositories/complaint.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { logger } from '@herafino/shared/logger/factory';
import { ComplaintCreateSchema } from '@herafino/shared/validation/complaint.schema';
import type { ID } from '@herafino/types';

const complaintRepository = new ComplaintRepository(new OutboxRepository());

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

    const complaints = await complaintRepository.findByReporterId(session.user.id);
    return NextResponse.json({ data: complaints });
  } catch (error) {
    logger.error({ error }, 'GET /api/complaints failed');
    return createErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    const body = await request.json();
    const parsed = ComplaintCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message?: string }) => e.message || 'Validation error').join(', ') },
        { status: 400 }
      );
    }

    const complaint = await complaintRepository.create({
      orderId: parsed.data.orderId,
      reporterId: session.user.id,
      againstUserId: parsed.data.againstUserId,
      reason: parsed.data.reason,
      description: parsed.data.description,
      evidenceUrls: parsed.data.evidenceUrls,
    });

    return NextResponse.json({ data: complaint }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'POST /api/complaints failed');
    return createErrorResponse(error);
  }
}
