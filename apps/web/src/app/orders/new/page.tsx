'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Hammer, MapPin, Send, Check } from 'lucide-react';
import { PageHeader, EmptyState, craftTypeLabel, CraftsmanStatusBadge } from '@/components/features/common/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import type { CraftType } from '@herafino/types';

type Craftsman = { id: string; userId: string; craftType: CraftType; status: string; workshopAddress: string };

async function fetchCraftsmen(): Promise<Craftsman[]> {
  const res = await fetch('/api/search');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function NewOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: craftsmen = [], isLoading } = useQuery({ queryKey: ['order-new-list'], queryFn: fetchCraftsmen });
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState({ description: '', address: '', estimatedPrice: '' });

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'فشل');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      router.push('/dashboard/client/orders');
    },
  });

  const sel = craftsmen.find((c) => c.id === selected);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6" dir="rtl">
      <PageHeader title="طلب خدمة جديدة" description="اختر حرفيًا وحدد تفاصيل طلبك" />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : craftsmen.length === 0 ? (
        <EmptyState icon={Hammer} title="لا يوجد حرفيون متاحون حالياً" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">1. اختر الحرفي</p>
            {craftsmen.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-all ${selected === c.id ? 'ring-2 ring-primary' : 'hover:shadow-soft'}`}
                onClick={() => setSelected(c.id)}
              >
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Hammer className="size-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{craftTypeLabel(c.craftType)}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="size-3" /> {c.workshopAddress}
                      </p>
                    </div>
                  </div>
                  {selected === c.id ? (
                    <Check className="size-5 text-primary" />
                  ) : (
                    <CraftsmanStatusBadge status={c.status as never} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">2. تفاصيل الطلب</p>
            <Card>
              <CardContent className="space-y-3 p-4">
                <Textarea
                  placeholder="اشرح المشكلة بالتفصيل…"
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
                  disabled={!selected || !form.description || !form.address || mutation.isPending}
                  onClick={() =>
                    sel &&
                    mutation.mutate({
                      craftsmanId: sel.userId,
                      craftType: sel.craftType,
                      description: form.description,
                      address: form.address,
                      latitude: '0',
                      longitude: '0',
                      estimatedPrice: form.estimatedPrice || undefined,
                    })
                  }
                >
                  <Send className="size-4" />
                  {mutation.isPending ? 'جارٍ الإرسال…' : 'إرسال الطلب'}
                </Button>
                {mutation.isError && <p className="text-xs text-red-600">{(mutation.error as Error).message}</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
