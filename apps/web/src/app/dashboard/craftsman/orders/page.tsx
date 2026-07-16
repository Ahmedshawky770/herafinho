'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, EmptyState, OrderStatusBadge, craftTypeLabel } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Package, Check, X, Flag } from 'lucide-react';
import { useState } from 'react';
import type { OrderStatus } from '@herafino/types';

type OrderItem = {
  id: string;
  craftType: string;
  status: OrderStatus;
  description: string;
  address: string;
  estimatedPrice?: string;
  createdAt: string;
};

async function fetchOrders(): Promise<OrderItem[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function patchOrder(id: string, action: string, body?: unknown) {
  const map: Record<string, string> = {
    accept: 'accept',
    reject: 'reject',
    complete: 'complete',
    cancel: 'cancel',
  };
  const res = await fetch(`/api/orders/${id}/${map[action]}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error('action failed');
  return res.json();
}

export default function CraftsmanOrdersPage() {
  const queryClient = useQueryClient();
  const [finalPrice, setFinalPrice] = useState<Record<string, string>>({});
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['craftsman-orders-page'], queryFn: fetchOrders });

  const mutation = useMutation({
    mutationFn: ({ id, action, body }: { id: string; action: string; body?: unknown }) =>
      patchOrder(id, action, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['craftsman-orders-page'] }),
  });

  if (isLoading) {
    return <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="h-40 animate-pulse rounded-xl bg-gray-100" /><div className="h-40 animate-pulse rounded-xl bg-gray-100" /></div>;
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="طلباتي" />
        <EmptyState icon={Package} title="لا توجد طلبات" description="ستصلك الطلبات من العملاء هنا" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="طلباتي" description={`${orders.length} طلب`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {orders.map((o) => (
          <Card key={o.id}>
            <CardHeader className="flex-row items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">{craftTypeLabel(o.craftType)}</CardTitle>
                <p className="mt-1 text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('ar-EG')}</p>
              </div>
              <OrderStatusBadge status={o.status} />
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-gray-700">{o.description}</p>
              <div className="flex items-center gap-1 text-gray-500">
                <span className="size-1.5 rounded-full bg-gray-300" />
                {o.address}
              </div>
              {o.estimatedPrice && (
                <p className="text-gray-600">السعر المقدر: {o.estimatedPrice} ج.م</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {o.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => mutation.mutate({ id: o.id, action: 'accept' })} disabled={mutation.isPending}>
                      <Check className="size-4" /> قبول
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => mutation.mutate({ id: o.id, action: 'reject' })} disabled={mutation.isPending}>
                      <X className="size-4" /> رفض
                    </Button>
                  </>
                )}
                {(o.status === 'accepted' || o.status === 'in_progress') && (
                  <div className="flex w-full items-center gap-2">
                    <Input
                      type="number"
                      placeholder="السعر النهائي"
                      value={finalPrice[o.id] ?? ''}
                      onChange={(e) => setFinalPrice((p) => ({ ...p, [o.id]: e.target.value }))}
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        mutation.mutate({
                          id: o.id,
                          action: 'complete',
                          body: { finalPrice: finalPrice[o.id] },
                        })
                      }
                      disabled={mutation.isPending || !finalPrice[o.id]}
                    >
                      <Flag className="size-4" /> إتمام
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
