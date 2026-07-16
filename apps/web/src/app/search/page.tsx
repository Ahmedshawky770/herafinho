'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Hammer } from 'lucide-react';
import { PageHeader, EmptyState, craftTypeLabel, CraftsmanStatusBadge } from '@/components/features/common/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { CraftType } from '@herafino/types';

const CRAFT_TYPES: CraftType[] = [
  'carpenter', 'plumber', 'painter', 'electrician', 'welder', 'tiler',
  'ceramicist', 'whitewasher', 'hvac', 'satellite', 'aluminum',
];

type Craftsman = {
  id: string;
  craftType: string;
  status: string;
  experienceYears: number;
  workshopAddress: string;
  userId?: string;
  name?: string;
};

async function searchCraftsmen(craftType?: string): Promise<Craftsman[]> {
  const qs = craftType ? `?craftType=${craftType}` : '';
  const res = await fetch(`/api/search${qs}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function SearchPage() {
  const router = useRouter();
  const [type, setType] = useState('');
  const [q, setQ] = useState('');

  const { data: craftsmen = [], isLoading } = useQuery({
    queryKey: ['search', type],
    queryFn: () => searchCraftsmen(type || undefined),
  });

  const filtered = q
    ? craftsmen.filter((c) => craftTypeLabel(c.craftType).includes(q) || (c.name ?? '').includes(q))
    : craftsmen;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <PageHeader title="ابحث عن حرفي" description="اعثر على حرفي موثوق بالقرب منك" />

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-soft sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pr-9"
              placeholder="ابحث باسم الحرفة…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-56">
            <option value="">كل الحرف</option>
            {CRAFT_TYPES.map((t) => (
              <option key={t} value={t}>{craftTypeLabel(t)}</option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Hammer} title="لا يوجد حرفيون مطابقون" description="جرّب تغيير نوع الحرفة أو البحث" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Card key={c.id} className="cursor-pointer transition-shadow hover:shadow-medium"
                onClick={() => router.push(`/craftsmen/${c.id}`)}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Hammer className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{craftTypeLabel(c.craftType)}</p>
                        <p className="text-xs text-gray-500">{c.name ?? 'حِرفي'}</p>
                      </div>
                    </div>
                    <CraftsmanStatusBadge status={c.status as never} />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="size-4 text-gray-400" />
                    <span className="line-clamp-1">{c.workshopAddress}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Star className="size-3.5 text-yellow-400" /> {c.experienceYears} سنوات</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => router.push('/dashboard/client')}>
            العودة للوحة التحكم
          </Button>
        </div>
      </div>
    </div>
  );
}
