import type { CraftType } from '@herafino/types';
import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { logger } from '@herafino/shared/logger/factory';

const craftsmanRepository = new CraftsmanRepository();

export async function GET(_request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(_request.url);
    const craftType = url.searchParams.get('craftType');

    if (craftType) {
      const profiles = await craftsmanRepository.findApprovedByCraftType(
        craftType as CraftType,
        '0',
        '0',
        50
      );
      return NextResponse.json({ data: profiles });
    }

    const profiles = await craftsmanRepository.getPendingProfiles();
    return NextResponse.json({ data: profiles });
  } catch (error) {
    logger.error({ error }, 'GET /api/craftsmen failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const existing = await craftsmanRepository.findProfileByUserId(userId);
    if (existing) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    const profile = await craftsmanRepository.createProfile({
      userId,
      craftType: body.craftType,
      experienceYears: body.experienceYears,
      idCardFrontUrl: body.idCardFrontUrl,
      idCardBackUrl: body.idCardBackUrl,
      facePhotoUrl: body.facePhotoUrl,
      transportType: body.transportType,
      transportPhotos: body.transportPhotos,
      workshopAddress: body.workshopAddress,
      workshopLatitude: body.workshopLatitude,
      workshopLongitude: body.workshopLongitude,
    });

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'POST /api/craftsmen failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
