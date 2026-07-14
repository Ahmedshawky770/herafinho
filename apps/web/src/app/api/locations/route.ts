import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { LocationRepository } from '@herafino/shared/repositories/location.repository';
import { logger } from '@herafino/shared/logger/factory';
import { UpdateLocationSchema } from '@herafino/shared/validation/location.schema';
import { AppError } from '@herafino/shared/errors/app-error';

const locationRepository = new LocationRepository();

export async function POST(request: Request) {
  try {
    const session = (await auth()) as { user?: { id?: string; role?: string } } | null;
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = UpdateLocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const location = await locationRepository.upsert(userId, parsed.data);

    return NextResponse.json({ data: location });
  } catch (error) {
    logger.error({ error }, 'POST /api/locations failed');
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
