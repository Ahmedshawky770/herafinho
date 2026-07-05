import { auth } from './options';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '../logger/factory';

export async function authMiddleware(request: NextRequest) {
  const session = await auth();
  
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/login') && session?.user) {
    const role = session.user.role ?? 'client';
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (!session?.user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/dashboard/admin')) {
    if (!session?.user || session.user.role !== 'admin') {
      logger.warn({ pathname, userId: session?.user?.id }, 'Unauthorized admin access attempt');
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  if (pathname.startsWith('/dashboard/craftsman')) {
    if (!session?.user || session.user.role !== 'craftsman') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}