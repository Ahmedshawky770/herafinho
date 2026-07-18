import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from '@/lib/cache/rate-limit.middleware';
import { rateLimitService } from '@herafino/shared/cache/rate-limit.service';

const RATE_LIMIT_CONFIG = { windowMs: 60000, maxRequests: 100 };

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(rateLimitService, RATE_LIMIT_CONFIG)(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const session = await auth();
  const { pathname } = request.nextUrl;

  const onboardingComplete = (session?.user as { onboardingComplete?: boolean } | undefined)?.onboardingComplete ?? false;
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'client';

  // The route a user must be on while onboarding is still incomplete. A user who
  // already picked the craftsman role must finish the craftsman profile form; any
  // other user must first pick their account type.
  const onboardingRoute = role === 'craftsman' ? '/dashboard/craftsman/onboarding' : '/choose-account';

  if (session && pathname === '/login') {
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL(onboardingRoute, request.url));
    }
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (!session?.user && (pathname.startsWith('/dashboard') || pathname.startsWith('/choose-account'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Onboarding is mandatory: a signed-in user who has not completed onboarding is
  // locked to their onboarding route and cannot navigate anywhere else until done.
  if (session?.user && !onboardingComplete && pathname !== onboardingRoute) {
    return NextResponse.redirect(new URL(onboardingRoute, request.url));
  }

  // Once onboarding is complete, keep users out of the onboarding routes.
  if (session?.user && onboardingComplete && (pathname === '/choose-account' || pathname === '/dashboard/craftsman/onboarding')) {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (pathname.startsWith('/dashboard/admin')) {
    // super_admin is a superset of admin and may access all admin sections.
    const adminRole = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user || (adminRole !== 'admin' && adminRole !== 'super_admin')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/super_admin')) {
    if (!session?.user || (session.user as { role?: string } | undefined)?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/super-admin')) {
    if (!session?.user || (session.user as { role?: string } | undefined)?.role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/craftsman')) {
    if (!session?.user || (session.user as { role?: string } | undefined)?.role !== 'craftsman') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
