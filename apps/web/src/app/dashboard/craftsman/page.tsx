'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Hammer, Package, Star, MapPin } from 'lucide-react';
import { PageHeader, StatCard, EmptyState, craftTypeLabel, CraftsmanStatusBadge } from '@/components/features/common/ui';
import { AvailabilityToggle } from '@/components/features/craftsman/availability-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import type { CraftsmanStatus } from '@herafino/types';

type Profile = {
  id: string;
  craftType: string;
  experienceYears: number;
  status: CraftsmanStatus;
  isAvailable: boolean;
  workshopAddress: string;
};

async function fetchProfile(): Promise<Profile | null> {
  const res = await fetch('/api/craftsmen/me');
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function fetchOrders() {
  const res = await fetch('/api/orders');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function CraftsmanDashboard() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { data: profile, isLoading: pLoading } = useQuery({ queryKey: ['craftsman-me'], queryFn: fetchProfile });
  const { data: orders = [] } = useQuery({ queryKey: ['craftsman-orders'], queryFn: fetchOrders });

  const toggleMutation = useMutation({
    mutationFn: async (available: boolean) => {
      const res = await fetch('/api/craftsmen/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: available }),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['craftsman-me'] }),
  });

  if (pLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="لوحة الحرفي" />
        <EmptyState
          icon={Hammer}
          title="لم تكمل ملف الحرفي بعد"
          description="أكمل بياناتك ووثائقك لتتمكن من استقبال الطلبات"
          action={
            <Link href="/dashboard/craftsman/onboarding">
              <Button>إكمال الملف الشخصي</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const active = orders.filter((o: { status: string }) =>
    ['pending', 'accepted', 'in_progress'].includes(o.status),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`مرحباً، ${session?.user?.name?.split(' ')[0] ?? 'حِرفي'}`}
        description="إدارة طلباتك وحالتك وموقعك"
        action={<CraftsmanStatusBadge status={profile.status} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="المهنة" value={craftTypeLabel(profile.craftType)} icon={Hammer} />
            <StatCard label="سنوات الخبرة" value={profile.experienceYears} icon={Star} accent="secondary" />
            <StatCard label="الطلبات النشطة" value={active} icon={Package} accent="muted" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-right">الطلبات الواردة</CardTitle>
            </CardHeader>
            <CardContent className="text-right text-sm text-gray-600">
              {orders.length === 0 ? (
                <p>لا توجد طلبات حالياً.</p>
              ) : (
                <ul className="space-y-2">
                  {orders.slice(0, 5).map((o: { id: string; craftType: string; status: string; address: string }) => (
                    <li key={o.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <span>{o.craftType}</span>
                      <span className="text-xs text-gray-500">{o.address}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/dashboard/craftsman/orders" className="mt-3 inline-block text-sm text-primary hover:underline">
                عرض كل الطلبات
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <AvailabilityToggle
            available={profile.isAvailable}
            onToggle={(v) => toggleMutation.mutate(v)}
          />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <MapPin className="size-4 text-primary" />
                ورشتي
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <p>{profile.workshopAddress}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
