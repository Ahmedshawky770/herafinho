import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { LocationRepository } from '@herafino/shared/repositories/location.repository';
import { logger } from '@herafino/shared/logger/factory';
import { AppError } from '@herafino/shared/errors/app-error';

const locationRepository = new LocationRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = (await auth()) as { user?: { id?: string; role?: string } } | null;
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    if (userId !== currentUserId && session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const location = await locationRepository.getByUserId(userId);
    if (!location) {
      throw new AppError('Location not found', 404);
    }

    return NextResponse.json({ data: location });
  } catch (error) {
    logger.error({ error }, 'GET /api/locations/[userId] failed');
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
