'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { OnboardingForm } from '@/components/features/craftsman/onboarding-form';
import { EmptyState } from '@/components/features/common/ui';
import { Clock, XCircle } from 'lucide-react';
import type { CraftsmanStatus } from '@herafino/types';

type Profile = { id: string; status: CraftsmanStatus; rejectionReason?: string | null } | null;

async function fetchProfile(): Promise<Profile> {
  const res = await fetch('/api/craftsmen/me');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default function CraftsmanOnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['craftsman-profile'],
    queryFn: fetchProfile,
    // While the craftsman is pending, keep checking so approval moves them on
    // automatically without a manual refresh.
    refetchInterval: (query) =>
      (query.state.data as Profile)?.status === 'pending' ? 10_000 : false,
  });

  // Once the profile has been reviewed and accepted (approved, or frozen which
  // is an already-approved craftsman), refresh the session so the middleware
  // lets them into the dashboard, then send them there. If the session refresh
  // fails, still attempt the redirect so the craftsman is never left stranded.
  const accepted = profile?.status === 'approved' || profile?.status === 'frozen';
  useEffect(() => {
    if (accepted) {
      updateSession()
        .catch(() => undefined)
        .finally(() => router.replace('/dashboard/craftsman'));
    }
  }, [accepted, updateSession, router]);

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;

  // Awaiting admin review: the craftsman stays on this waiting screen and cannot
  // reach the dashboard until approved.
  if (profile?.status === 'pending') {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Clock}
          title="حسابك قيد المراجعة"
          description="تم استلام بياناتك بنجاح. سيقوم فريقنا بمراجعة حسابك والموافقة عليه قريباً، وسيصلك إشعار على بريدك الإلكتروني بالقبول أو الرفض."
        />
      </div>
    );
  }

  // Rejected: show the reason. The craftsman stays outside the dashboard.
  if (profile?.status === 'rejected') {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={XCircle}
          title="لم يتم قبول حسابك"
          description={profile.rejectionReason
            ? `سبب الرفض: ${profile.rejectionReason}. لمزيد من المعلومات يُرجى التواصل مع الدعم.`
            : 'لم يتم قبول حسابك. لمزيد من المعلومات يُرجى التواصل مع الدعم.'}
        />
      </div>
    );
  }

  // Accepted profiles (approved/frozen) are handled by the redirect effect
  // above; render a placeholder only while the session refreshes and the
  // redirect runs, so no state can get stuck on an infinite skeleton.
  if (accepted) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <OnboardingForm
      onSubmitted={() => {
        // Do not go to the dashboard: the craftsman must wait for admin approval.
        // Refresh the query so the waiting screen appears immediately.
        router.refresh();
      }}
    />
  );
}
