import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.redirect(new URL('/auth/login', process.env.NEXTAUTH_URL));
    }
    return NextResponse.json({ user: session.user });
  } catch (error) {
    return NextResponse.redirect(new URL('/auth/login', process.env.NEXTAUTH_URL));
  }
}