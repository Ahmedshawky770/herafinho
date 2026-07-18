import type { ReactNode } from 'react';
import { Sidebar } from '@/components/features/layout/sidebar';
import { TopBar } from '@/components/features/layout/top-bar';
import { auth } from '@/app/auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const onboardingComplete = session?.user?.onboardingComplete ?? false;

  // While onboarding is still mandatory and incomplete, render a bare layout with
  // no navigation so the user cannot leave the onboarding flow.
  if (session?.user && !onboardingComplete) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-3xl animate-fade-in">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
