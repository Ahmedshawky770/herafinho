import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/app/auth';
import { LandingPage } from '@/components/features/landing-page';

export default async function Home() {
  const session = await auth();

  if (session) {
    const role = (session.user as { role?: string })?.role ?? 'client';
    redirect(`/dashboard/${role}`);
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LandingPage />
    </Suspense>
  );
}
