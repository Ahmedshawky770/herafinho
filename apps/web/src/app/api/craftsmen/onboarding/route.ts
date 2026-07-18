import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { CraftsmanRepository } from '@herafino/shared/repositories/craftsman.repository';
import { OutboxRepository } from '@herafino/shared/events/outbox-repository';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { logger } from '@herafino/shared/logger/factory';
import { OnboardingSchema } from '@herafino/shared/validation/onboarding.schema';
import type { ID } from '@herafino/types';

const craftsmanRepository = new CraftsmanRepository(new OutboxRepository());
const userRepository = new UserRepository();

interface AuthSession {
  user?: {
    id?: ID;
    role?: string;
  };
}

export async function POST(request: Request) {
  try {
    const session = (await auth()) as AuthSession | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const parsed = OnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e: { message?: string }) => e.message || 'Validation error').join(', ') },
        { status: 400 }
      );
    }

    const existing = await craftsmanRepository.findProfileByUserId(userId);
    if (existing) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    const profile = await craftsmanRepository.createProfile({
      userId,
      craftType: parsed.data.craftType as import('@herafino/types').CraftType,
      experienceYears: parsed.data.experienceYears,
      idCardFrontUrl: parsed.data.idCardFrontUrl,
      idCardBackUrl: parsed.data.idCardBackUrl,
      facePhotoUrl: parsed.data.facePhotoUrl,
      transportType: parsed.data.transportType,
      transportPhotos: parsed.data.transportPhotos ?? [],
      vehicleNumber: parsed.data.vehicleNumber ?? '',
      workshopAddress: parsed.data.workshopAddress,
      workshopLatitude: parsed.data.workshopLatitude,
      workshopLongitude: parsed.data.workshopLongitude,
    });

    // The craftsman has submitted their profile but must remain pending until an
    // admin approves them. Onboarding is intentionally left incomplete so the
    // mandatory-onboarding middleware keeps them on the waiting screen and out of
    // the dashboard until approval.
    await userRepository.update(userId, { role: 'craftsman', onboardingComplete: false });

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'POST /api/craftsmen/onboarding failed');
    return createErrorResponse(error);
  }
}