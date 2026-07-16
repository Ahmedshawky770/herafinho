'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Hammer, MapPin, Star, Clock, Send, ArrowRight } from 'lucide-react';
import { EmptyState, craftTypeLabel, CraftsmanStatusBadge } from '@/components/features/common/ui';
import { LiveMap } from '@/components/features/common/live-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { CraftsmanStatus, CraftType } from '@herafino/types';

type Profile = {
  id: string;
  userId: string;
  craftType: CraftType;
  status: CraftsmanStatus;
  experienceYears: number;
  workshopAddress: string;
  transportType: string;
  workshopLatitude: string;
  workshopLongitude: string;
};

type Review = { id: string; rating: number; comment?: string; createdAt: string };

async function fetchProfile(id: string): Promise<Profile | null> {
  const res = await fetch(`/api/craftsmen/${id}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function fetchReviews(id: string): Promise<Review[]> {
  const res = await fetch(`/api/reviews/craftsman/${id}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function CraftsmanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = String(params.id);

  const { data: profile, isLoading } = useQuery({ queryKey: ['craftsman', id], queryFn: () => fetchProfile(id) });
  const { data: reviews = [] } = useQuery({ queryKey: ['craftsman-reviews', id], queryFn: () => fetchReviews(id) });

  const [form, setForm] = useState({ description: '', address: '', estimatedPrice: '' });

  const orderMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'فشل إرسال الطلب');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      router.push('/dashboard/client/orders');
    },
  });

  if (isLoading) return <div className="mx-auto mt-10 h-64 w-full max-w-3xl animate-pulse rounded-xl bg-gray-100" />;
  if (!profile) return (
    <div className="mx-auto mt-10 max-w-3xl p-4">
      <EmptyState icon={Hammer} title="الحِرفي غير موجود" />
    </div>
  );

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary">
          <ArrowRight className="size-4" /> رجوع
        </button>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Hammer className="size-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{craftTypeLabel(profile.craftType)}</h2>
                      <p className="text-sm text-gray-500">{profile.experienceYears} سنوات خبرة</p>
                    </div>
                  </div>
                  <CraftsmanStatusBadge status={profile.status} />
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><MapPin className="size-4 text-gray-400" /> {profile.workshopAddress}</span>
                  {reviews.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" /> {avg.toFixed(1)} ({reviews.length})
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {Number(profile.workshopLatitude) && Number(profile.workshopLongitude) ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right">
                    <MapPin className="size-4 text-primary" /> موقع الورشة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LiveMap
                    center={{ lat: Number(profile.workshopLatitude), lng: Number(profile.workshopLongitude) }}
                    markers={[
                      {
                        id: profile.id,
                        lat: Number(profile.workshopLatitude),
                        lng: Number(profile.workshopLongitude),
                        popup: craftTypeLabel(profile.craftType),
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <Star className="size-4 text-primary" /> التقييمات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-500">لا توجد تقييمات بعد.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star key={i} className={i <= r.rating ? 'size-4 fill-yellow-400 text-yellow-400' : 'size-4 text-gray-300'} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <Send className="size-4 text-primary" /> أطلب خدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="اشرح طلبك بالتفصيل…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <Input
                  placeholder="العنوان"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="السعر المتوقع (اختياري)"
                  value={form.estimatedPrice}
                  onChange={(e) => setForm((f) => ({ ...f, estimatedPrice: e.target.value }))}
                />
                <Button
                  className="w-full"
                  disabled={!form.description || !form.address || orderMutation.isPending}
                  onClick={() =>
                    orderMutation.mutate({
                      craftsmanId: profile.userId,
                      craftType: profile.craftType,
                      description: form.description,
                      address: form.address,
                      latitude: '0',
                      longitude: '0',
                      estimatedPrice: form.estimatedPrice || undefined,
                    })
                  }
                >
                  <Send className="size-4" />
                  {orderMutation.isPending ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
                </Button>
                {orderMutation.isError && (
                  <p className="text-xs text-red-600">{(orderMutation.error as Error).message}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="size-3.5" /> سيتم إعلام الحرفي فوراً
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
