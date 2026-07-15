import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { ComplaintRepository } from '@herafino/shared/repositories/complaint.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const complaintRepository = new ComplaintRepository(new OutboxRepository());

interface AuthSession {
  user?: {
    id?: ID;
    role?: string;
  };
}

function requireAdmin(session: AuthSession | null): asserts session is { user: { id: ID; role: string } } {
  if (!session?.user || session.user.role !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }
}

export async function GET() {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAdmin(session);

    const complaints = await complaintRepository.findPending();
    return NextResponse.json({ data: complaints });
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/complaints/pending failed');
    return createErrorResponse(error);
  }
}
