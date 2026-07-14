import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { db } from '@herafino/shared/db';
import { complaints } from '@herafino/shared/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userComplaints = await db
      .select()
      .from(complaints)
      .where(eq(complaints.reporterId, session.user.id));

    return NextResponse.json({ data: userComplaints });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, againstUserId, reason, description, evidenceUrls } = body;

    const newComplaint = await db
      .insert(complaints)
      .values({
        id: crypto.randomUUID(),
        orderId,
        reporterId: session.user.id,
        againstUserId,
        reason,
        description,
        evidenceUrls: evidenceUrls || [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: newComplaint[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}