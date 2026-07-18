import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/app/auth';
import { LandingPage } from '@/components/features/landing-page';

export default async function Home() {
  const session = await auth();

  if (session) {
    const role = (session.user as { role?: string })?.role ?? 'client';
    const onboardingComplete = (session.user as { onboardingComplete?: boolean })?.onboardingComplete ?? false;
    // Onboarding is mandatory: send users who have not finished onboarding to
    // their onboarding flow instead of the dashboard.
    if (!onboardingComplete) {
      redirect(role === 'craftsman' ? '/dashboard/craftsman/onboarding' : '/choose-account');
    }
    redirect(`/dashboard/${role}`);
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LandingPage />
    </Suspense>
  );
}
