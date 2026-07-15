import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { ComplaintRepository } from '@herafino/shared/repositories/complaint.repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

const complaintRepository = new ComplaintRepository();

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
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    if (role !== 'admin' && complaint.reporterId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: complaint });
  } catch (error) {
    logger.error({ error }, 'GET /api/complaints/[id] failed');
    return createErrorResponse(error);
  }
}
