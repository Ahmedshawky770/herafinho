import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { db } from '@herafino/shared/db';
import { users, craftsmanProfiles, orders, complaints } from '@herafino/shared/db/schema';
import { eq, sql } from 'drizzle-orm';
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

export async function GET() {
  try {
    const session = (await auth()) as AuthSession | null;
    requireAdmin(session);

    const [pendingCraftsmenCount] = await db.select({ count: sql<number>`count(*)` })
      .from(craftsmanProfiles)
      .where(eq(craftsmanProfiles.status, 'pending'));

    const [pendingComplaintsCount] = await db.select({ count: sql<number>`count(*)` })
      .from(complaints)
      .where(eq(complaints.status, 'pending'));

    const [totalOrdersCount] = await db.select({ count: sql<number>`count(*)` })
      .from(orders);

    const [totalUsersCount] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isDeleted, false));

    return NextResponse.json({
      data: {
        pendingCraftsmen: Number(pendingCraftsmenCount.count ?? 0),
        pendingComplaints: Number(pendingComplaintsCount.count ?? 0),
        totalOrders: Number(totalOrdersCount.count ?? 0),
        totalUsers: Number(totalUsersCount.count ?? 0),
      },
    });
  } catch (error) {
    logger.error({ error }, 'GET /api/admin/stats failed');
    return createErrorResponse(error);
  }
}
