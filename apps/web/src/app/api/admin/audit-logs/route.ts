import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { db } from '@herafino/shared/db';
import { auditLogs } from '@herafino/shared/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

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
    const action = searchParams.get('action') as string | null;
    const targetType = searchParams.get('targetType') as string | null;
    const fromDate = searchParams.get('from') as string | null;
    const toDate = searchParams.get('to') as string | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get('limit') || '20', 10) || 20));

    const conditions = [];
    if (action) conditions.push(eq(auditLogs.action, action));
    if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
    if (fromDate) conditions.push(gte(auditLogs.createdAt, new Date(fromDate)));
    if (toDate) conditions.push(lte(auditLogs.createdAt, new Date(toDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(whereClause);
    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const logs = await db.query.auditLogs.findMany({
      where: whereClause,
      orderBy: (log, { desc: order }) => [order(log.createdAt)],
      limit,
      offset: (page - 1) * limit,
      with: {
        actor: {
          columns: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/audit-logs failed');
    return createErrorResponse(error);
  }
}
