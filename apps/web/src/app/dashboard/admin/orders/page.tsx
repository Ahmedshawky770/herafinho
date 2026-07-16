'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader, EmptyState, OrderStatusBadge, craftTypeLabel } from '@/components/features/common/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import type { OrderStatus } from '@herafino/types';

type Order = {
  id: string;
  craftType: string;
  status: OrderStatus;
  address: string;
  clientName?: string;
  craftsmanName?: string;
  createdAt: string;
};

async function fetchOrders(status?: string): Promise<Order[]> {
  const qs = status && status !== 'all' ? `?status=${status}` : '';
  const res = await fetch(`/api/admin/orders${qs}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function AdminOrdersPage() {
  const [tab, setTab] = useState('all');
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', tab],
    queryFn: () => fetchOrders(tab),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="إدارة الطلبات" description="متابعة جميع الطلبات على المنصة" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex w-full max-w-full gap-1 overflow-x-auto">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="pending">بانتظار القبول</TabsTrigger>
          <TabsTrigger value="accepted">مقبولة</TabsTrigger>
          <TabsTrigger value="in_progress">قيد التنفيذ</TabsTrigger>
          <TabsTrigger value="completed">مكتملة</TabsTrigger>
          <TabsTrigger value="cancelled">ملغية</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="لا توجد طلبات" />
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Card key={o.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{craftTypeLabel(o.craftType)}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{o.address}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        عميل: {o.clientName ?? '—'} · حرفي: {o.craftsmanName ?? 'غير معيَّن'}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString('ar-EG')}
                    </p>
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
