import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { db } from '@herafino/shared/db';
import { craftsmanLocations } from '@herafino/shared/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const location = await db
      .select()
      .from(craftsmanLocations)
      .where(eq(craftsmanLocations.userId, session.user.id))
      .limit(1);

    return NextResponse.json({ data: location[0] || null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}