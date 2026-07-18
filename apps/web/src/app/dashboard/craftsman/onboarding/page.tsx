'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { OnboardingForm } from '@/components/features/craftsman/onboarding-form';
import { EmptyState } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Hammer, ArrowRight } from 'lucide-react';

type Profile = { id: string } | null;

async function fetchProfile(): Promise<Profile> {
  const res = await fetch('/api/craftsmen/me');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default function CraftsmanOnboardingPage() {
  const router = useRouter();
  const { data: profile, isLoading } = useQuery({ queryKey: ['craftsman-profile'], queryFn: fetchProfile });

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;

  if (profile) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={Hammer}
          title="تم إعداد حسابك مسبقاً"
          description="بيانات الحرفي مكتملة ويمكنك مراجعتها من الملف الشخصي."
          action={
            <Button onClick={() => router.push('/dashboard/craftsman')}>
              <ArrowRight className="size-4" /> الذهاب للوحة التحكم
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <OnboardingForm
      onSubmitted={() => {
        router.push('/dashboard/craftsman');
      }}
    />
  );
}
