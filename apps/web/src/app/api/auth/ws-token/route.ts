import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { cookies } from 'next/headers';
import { auth } from '@/app/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const store = await cookies();
  const token = await getToken({ req: { cookies: store } as never });

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 });
  }

  return NextResponse.json({ token });
}
