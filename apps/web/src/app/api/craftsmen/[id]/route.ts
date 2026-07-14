import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { logger } from '@herafino/shared/logger/factory';

const craftsmanRepository = new CraftsmanRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await craftsmanRepository.findProfileById(id);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    logger.error({ error }, 'GET /api/craftsmen/[id] failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const profile = await craftsmanRepository.findProfileById(id);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.userId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await craftsmanRepository.updateProfile(id, body);

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error({ error }, 'PATCH /api/craftsmen/[id] failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const profile = await craftsmanRepository.findProfileById(id);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.userId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await craftsmanRepository.updateProfile(id, { isAvailable: false, isOnline: false });

    return NextResponse.json({ data: null }, { status: 204 });
  } catch (error) {
    logger.error({ error }, 'DELETE /api/craftsmen/[id] failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
