import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/http/error-handler';
import { auth } from '@/app/auth';
import { UserRepository } from '@herafino/shared/repositories/user.repository';
import { logger } from '@herafino/shared/logger/factory';
import type { ID, UserRole } from '@herafino/types';

const userRepository = new UserRepository();

const ALLOWED_ROLES: UserRole[] = ['client', 'craftsman'];

export async function POST(request: Request) {
  try {
    const session = (await auth()) as { user?: { id?: ID; onboardingComplete?: boolean } } | null;
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const role = body?.role as UserRole | undefined;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'يجب اختيار نوع الحساب' }, { status: 400 });
    }

    // A client finishes onboarding as soon as they pick their account type.
    // A craftsman must still complete the craftsman profile form, so we keep
    // onboarding incomplete until the profile is created.
    const updated = await userRepository.update(userId, {
      role,
      onboardingComplete: role === 'client',
    });

    logger.info({ userId, role }, 'User completed account-type onboarding');

    return NextResponse.json({ data: { role: updated.role, onboardingComplete: updated.onboardingComplete } });
  } catch (error) {
    logger.error({ error }, 'POST /api/users/onboarding failed');
    return createErrorResponse(error);
  }
}
