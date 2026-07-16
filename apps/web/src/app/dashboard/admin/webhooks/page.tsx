'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, EmptyState } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Webhook, Plus, Trash2, Power } from 'lucide-react';
import { useState } from 'react';

type Webhook = {
  id: string;
  event: string;
  url: string;
  secret: string;
  isActive: boolean;
  retryCount: number;
  lastTriggeredAt?: string;
};

async function fetchWebhooks(): Promise<Webhook[]> {
  const res = await fetch('/api/admin/webhooks');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function AdminWebhooksPage() {
  const queryClient = useQueryClient();
  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['admin-webhooks'],
    queryFn: fetchWebhooks,
  });

  const [form, setForm] = useState({ event: '', url: '', secret: '' });

  const createMutation = useMutation({
    mutationFn: async (body: { event: string; url: string; secret: string }) => {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'فشل الإنشاء');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch('/api/admin/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/webhooks?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Webhooks"
        description="أرسل أحداث المنصة إلى خدماتك الخارجية تلقائياً"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Plus className="size-4 text-primary" /> إضافة Webhook جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              placeholder="نوع الحدث (مثل craftsman.approved)"
              value={form.event}
              onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))}
            />
            <Input
              placeholder="الرابط (URL)"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
            <Input
              placeholder="السر (secret)"
              value={form.secret}
              onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
            />
          </div>
          <Button
            className="w-full sm:w-auto"
            disabled={!form.event || !form.url || !form.secret || createMutation.isPending}
            onClick={() =>
              createMutation.mutate(form, {
                onSuccess: () => setForm({ event: '', url: '', secret: '' }),
              })
            }
          >
            <Plus className="size-4" />
            {createMutation.isPending ? 'جارٍ الإضافة…' : 'إضافة'}
          </Button>
          {createMutation.isError && (
            <p className="text-xs text-red-600">{(createMutation.error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <EmptyState icon={Webhook} title="لا توجد Webhooks بعد" description="أضف أول webhook لربط المنصة بخدماتك" />
      ) : (
        <div className="space-y-3">
          {webhooks.map((w) => (
            <Card key={w.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-800">
                      {w.event}
                    </code>
                    <Badge variant={w.isActive ? 'default' : 'secondary'}>
                      {w.isActive ? 'مفعّل' : 'متوقف'}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-gray-500">{w.url}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    المحاولات: {w.retryCount}
                    {w.lastTriggeredAt
                      ? ` · آخر تشغيل: ${new Date(w.lastTriggeredAt).toLocaleString('ar-EG')}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMutation.mutate({ id: w.id, isActive: !w.isActive })}
                    disabled={toggleMutation.isPending}
                  >
                    <Power className="size-4" />
                    {w.isActive ? 'إيقاف' : 'تفعيل'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(w.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
