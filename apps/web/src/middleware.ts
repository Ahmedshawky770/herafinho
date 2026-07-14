import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from '@herafino/shared/cache/rate-limit.middleware';
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

  if (session && pathname === '/login') {
    const role = (session.user as { role?: string } | undefined)?.role ?? 'client';
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (!session?.user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/dashboard/admin')) {
    if (!session?.user || (session.user as { role?: string } | undefined)?.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/super_admin')) {
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
