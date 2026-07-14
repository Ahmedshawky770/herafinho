import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { logger } from '@herafino/shared/logger/factory';

const craftsmanRepository = new CraftsmanRepository();

export async function GET() {
  try {
    const session = (await auth()) as { user?: { id?: string } } | null;
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await craftsmanRepository.findProfileByUserId(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    logger.error({ error }, 'GET /api/craftsmen/me failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = (await auth()) as { user?: { id?: string } } | null;
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await craftsmanRepository.findProfileByUserId(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const updated = await craftsmanRepository.updateProfile(profile.id, body);

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/craftsmen/me failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
