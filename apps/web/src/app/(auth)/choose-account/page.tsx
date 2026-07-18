'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Hammer, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserRole } from '@herafino/types';

export default function ChooseAccountPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onboardingComplete = (session?.user as { onboardingComplete?: boolean } | undefined)?.onboardingComplete ?? false;
  const role = (session?.user as { role?: string } | undefined)?.role ?? 'client';

  useEffect(() => {
    if (status !== 'authenticated') return;
    // A craftsman still has to finish their profile before onboarding is done.
    if (role === 'craftsman' && !onboardingComplete) {
      router.replace('/dashboard/craftsman/onboarding');
      return;
    }
    if (onboardingComplete) {
      router.replace(`/dashboard/${role}`);
    }
  }, [status, onboardingComplete, role, router]);

  if (status === 'unauthenticated') {
    router.replace('/login');
    return null;
  }

  if (status === 'loading' || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50" dir="rtl">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (onboardingComplete) return null;

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selected }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'فشل الإرسال');
      }
      // Refresh the session so the JWT reflects the newly chosen role/onboarding
      // state before the mandatory-onboarding middleware evaluates the next route.
      await updateSession();
      await router.replace(selected === 'craftsman' ? '/dashboard/craftsman/onboarding' : '/dashboard/client');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإرسال');
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">اختر نوع حسابك</h1>
          <p className="mt-2 text-sm text-gray-500">يجب اختيار نوع الحساب لإكمال التسجيل</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => setSelected('client')} className="text-right">
            <Card className={`transition-colors ${selected === 'client' ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5 text-primary" /> عميل
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                ابحث عن حرفي موثوق واطلب خدماته.
              </CardContent>
            </Card>
          </button>

          <button type="button" onClick={() => setSelected('craftsman')} className="text-right">
            <Card className={`transition-colors ${selected === 'craftsman' ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="size-5 text-primary" /> حِرفي
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                سجّل حرفتك واستقبل الطلبات من العملاء.
              </CardContent>
            </Card>
          </button>
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <Button className="w-full" disabled={!selected || submitting} onClick={submit}>
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? 'جارٍ الإرسال…' : 'متابعة'}
        </Button>
      </div>
    </div>
  );
}
