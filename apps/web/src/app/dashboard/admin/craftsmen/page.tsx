'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, EmptyState, CraftsmanStatusBadge, craftTypeLabel } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User, Check, X, Snowflake, Ban, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import type { CraftsmanStatus } from '@herafino/types';

type Craftsman = {
  id: string;
  userId: string;
  craftType: string;
  status: CraftsmanStatus;
  experienceYears: number;
  workshopAddress: string;
  freezeCount: number;
  createdAt: string;
};

async function fetchCraftsmen(status?: string): Promise<Craftsman[]> {
  const qs = status && status !== 'all' ? `?status=${status}` : '';
  const res = await fetch(`/api/admin/craftsmen${qs}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function act(id: string, action: string, body?: unknown) {
  const res = await fetch(`/api/admin/craftsmen/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('action failed');
  return res.json();
}

export default function AdminCraftsmenPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [reason, setReason] = useState<Record<string, string>>({});

  const { data: craftsmen = [], isLoading } = useQuery({
    queryKey: ['admin-craftsmen', tab],
    queryFn: () => fetchCraftsmen(tab),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: unknown }) =>
      act(id, action, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-craftsmen'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="إدارة الحرفيين" description="مراجعة وتوثيق ومتابعة الحرفيين" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full max-w-full gap-1 overflow-x-auto">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="pending">بانتظار المراجعة</TabsTrigger>
          <TabsTrigger value="approved">موثّقون</TabsTrigger>
          <TabsTrigger value="frozen">مجمّدون</TabsTrigger>
          <TabsTrigger value="banned">محظورون</TabsTrigger>
          <TabsTrigger value="rejected">مرفوضون</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : craftsmen.length === 0 ? (
            <EmptyState icon={User} title="لا يوجد حرفيين في هذا التصنيف" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {craftsmen.map((c) => (
                <Card key={c.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{craftTypeLabel(c.craftType)}</p>
                        <p className="text-xs text-gray-500">
                          {c.experienceYears} سنوات خبرة · {new Date(c.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <CraftsmanStatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{c.workshopAddress}</p>
                    {c.freezeCount > 0 && (
                      <p className="text-xs text-amber-600">عدد التجميد: {c.freezeCount}</p>
                    )}

                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      {c.status === 'pending' && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => mutation.mutate({ id: c.id, action: 'approve' })} disabled={mutation.isPending}>
                            <Check className="size-4" /> موافقة
                          </Button>
                          <input
                            className="input h-8 flex-1 text-xs"
                            placeholder="سبب الرفض"
                            value={reason[c.id] ?? ''}
                            onChange={(e) => setReason((r) => ({ ...r, [c.id]: e.target.value }))}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              mutation.mutate({ id: c.id, action: 'reject', body: { reason: reason[c.id] || 'غير مطابق' } })
                            }
                            disabled={mutation.isPending}
                          >
                            <X className="size-4" /> رفض
                          </Button>
                        </div>
                      )}
                      {c.status === 'approved' && (
                        <div className="flex flex-wrap gap-2">
                          <input
                            className="input h-8 flex-1 text-xs"
                            placeholder="سبب التجميد"
                            value={reason[c.id] ?? ''}
                            onChange={(e) => setReason((r) => ({ ...r, [c.id]: e.target.value }))}
                          />
                          <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: c.id, action: 'freeze', body: { reason: reason[c.id] || 'مخالفة' } })} disabled={mutation.isPending}>
                            <Snowflake className="size-4" /> تجميد
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => mutation.mutate({ id: c.id, action: 'ban', body: { reason: reason[c.id] || 'حظر نهائي' } })} disabled={mutation.isPending}>
                            <Ban className="size-4" /> حظر
                          </Button>
                        </div>
                      )}
                      {c.status === 'frozen' && (
                        <Button size="sm" variant="outline" onClick={() => mutation.mutate({ id: c.id, action: 'unfreeze' })} disabled={mutation.isPending}>
                          <RotateCcw className="size-4" /> إلغاء التجميد
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
