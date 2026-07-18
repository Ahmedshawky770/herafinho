'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, X, Snowflake, Ban, RotateCcw, MapPin, Star } from 'lucide-react';
import {
  PageHeader,
  EmptyState,
  craftTypeLabel,
  CraftsmanStatusBadge,
} from '@/components/features/common/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

async function fetchCraftsmen(): Promise<Craftsman[]> {
  const res = await fetch('/api/admin/craftsmen');
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

export default function AdminCraftsmanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = String(params.id);

  const { data: craftsmen = [], isLoading } = useQuery({
    queryKey: ['admin-craftsmen'],
    queryFn: fetchCraftsmen,
  });

  const craftsman = craftsmen.find((c) => c.id === id || c.userId === id);

  const mutation = useMutation({
    mutationFn: ({ action, body }: { action: string; body?: unknown }) =>
      act(id, action, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-craftsmen'] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-100" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (!craftsman) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-1">
          <ArrowRight className="size-4" /> رجوع
        </Button>
        <EmptyState icon={MapPin} title="الحِرفي غير موجود" />
      </div>
    );
  }

  const actions: Record<CraftsmanStatus, React.ReactNode> = {
    pending: (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => mutation.mutate({ action: 'approve' })} disabled={mutation.isPending}>
          <Check className="size-4" /> موافقة
        </Button>
        <Button size="sm" variant="destructive" onClick={() => mutation.mutate({ action: 'reject', body: { reason: 'غير مطابق' } })} disabled={mutation.isPending}>
          <X className="size-4" /> رفض
        </Button>
      </div>
    ),
    approved: (
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => mutation.mutate({ action: 'freeze', body: { reason: 'مخالفة' } })} disabled={mutation.isPending}>
          <Snowflake className="size-4" /> تجميد
        </Button>
        <Button size="sm" variant="destructive" onClick={() => mutation.mutate({ action: 'ban', body: { reason: 'حظر نهائي' } })} disabled={mutation.isPending}>
          <Ban className="size-4" /> حظر
        </Button>
      </div>
    ),
    frozen: (
      <Button size="sm" variant="outline" onClick={() => mutation.mutate({ action: 'unfreeze' })} disabled={mutation.isPending}>
        <RotateCcw className="size-4" /> إلغاء التجميد
      </Button>
    ),
    rejected: (
      <Button size="sm" variant="outline" onClick={() => mutation.mutate({ action: 'approve' })} disabled={mutation.isPending}>
        <Check className="size-4" /> إعادة التوثيق
      </Button>
    ),
    banned: (
      <Button size="sm" variant="outline" onClick={() => mutation.mutate({ action: 'unfreeze' })} disabled={mutation.isPending}>
        <RotateCcw className="size-4" /> رفع الحظر
      </Button>
    ),
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-1">
        <ArrowRight className="size-4" /> رجوع للحرفيين
      </Button>

      <PageHeader
        title={craftTypeLabel(craftsman.craftType)}
        description="تفاصيل وبدائل إدارة الحِرفي"
        action={<CraftsmanStatusBadge status={craftsman.status} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">البيانات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="نوع الحرفة" value={craftTypeLabel(craftsman.craftType)} />
              <Row label="سنوات الخبرة" value={`${craftsman.experienceYears} سنة`} />
              <Row label="عنوان الورشة" value={craftsman.workshopAddress} />
              <Row label="عدد مرات التجميد" value={`${craftsman.freezeCount}`} />
              <Row label="تاريخ التسجيل" value={new Date(craftsman.createdAt).toLocaleDateString('ar-EG')} />
              <div className="flex items-center gap-2">
                <Star className="size-4 text-gray-400" />
                <span className="text-gray-500">المعرّف:</span>
                <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{craftsman.id}</code>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-right">إجراءات الإدارة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actions[craftsman.status]}
              {mutation.isError && (
                <p className="text-xs text-red-600">تعذّر تنفيذ الإجراء. حاول مرة أخرى.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
