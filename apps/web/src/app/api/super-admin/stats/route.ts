import { NextResponse } from 'next/server';
import { ForbiddenError } from '@herafino/shared/errors/app-error';
import { createErrorResponse } from '@herafino/shared/http/error-handler';
import { auth } from '@/app/auth';
import { db } from '@herafino/shared/db';
import { users, orders, complaints } from '@herafino/shared/db/schema';
import { sql, eq } from 'drizzle-orm';
import { logger } from '@herafino/shared/logger/factory';
import type { ID } from '@herafino/types';

interface AuthSession {
  user?: {
    id?: ID;
    role?: string;
  };
}

function requireSuperAdmin(session: AuthSession | null): asserts session is { user: { id: ID; role: string } } {
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new ForbiddenError('Forbidden');
  }
}

export async function GET() {
  try {
    const session = (await auth()) as AuthSession | null;
    requireSuperAdmin(session);

    const [totalUsersCount] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.role} != 'super_admin'`);

    const [totalCraftsmenCount] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'craftsman'));

    const [totalOrdersCount] = await db.select({ count: sql<number>`count(*)` })
      .from(orders);

    const [totalComplaintsCount] = await db.select({ count: sql<number>`count(*)` })
      .from(complaints);

    return NextResponse.json({
      data: {
        totalUsers: Number(totalUsersCount.count ?? 0),
        totalCraftsmen: Number(totalCraftsmenCount.count ?? 0),
        totalOrders: Number(totalOrdersCount.count ?? 0),
        totalComplaints: Number(totalComplaintsCount.count ?? 0),
      },
    });
  } catch (error) {
    logger.error({ error }, 'GET /api/super-admin/stats failed');
    return createErrorResponse(error);
  }
}
