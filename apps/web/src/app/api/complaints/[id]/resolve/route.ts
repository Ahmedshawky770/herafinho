import { NextResponse } from 'next/server';
import { UnauthorizedError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { ComplaintRepository } from '@herafino/shared/repositories/complaint.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { z } from 'zod';
import { logger } from '@herafino/shared/logger/factory';
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

const ComplaintResolveSchema = z.object({
  action: z.enum(['warning', 'freeze', 'permanent_ban']),
  notes: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAuth(session);

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only admins can resolve complaints' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ComplaintResolveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message?: string }) => e.message || 'Validation error').join(', ') },
        { status: 400 }
      );
    }

    const { id } = await params;
    const complaint = await complaintRepository.findById(id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (complaint.status === 'resolved' || complaint.status === 'dismissed') {
      return NextResponse.json({ error: 'Complaint is already resolved or dismissed' }, { status: 400 });
    }

    const updated = await complaintRepository.resolve(id, parsed.data.action, session.user.id);

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/complaints/[id]/resolve failed');
    return createErrorResponse(error);
  }
}
