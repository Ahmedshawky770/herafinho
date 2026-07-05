import { auth } from '@/lib/auth/options';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export default auth(function middleware(request: NextRequest) {
  const session = (request as unknown as { auth?: { user?: { role?: string } } }).auth;
  const { pathname } = request.nextUrl;

  if (session && pathname === '/login') {
    const role = session.user?.role ?? 'client';
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (!session?.user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/dashboard/admin')) {
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/craftsman')) {
    if (!session?.user || session.user.role !== 'craftsman') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};