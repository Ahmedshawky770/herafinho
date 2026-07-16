'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader, OrderStatusBadge, EmptyState } from '@/components/features/common/ui';
import { OrderCard } from '@/components/features/orders/order-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Package, Search } from 'lucide-react';
import type { OrderStatus } from '@herafino/types';

type OrderItem = {
  id: string;
  craftType: string;
  status: OrderStatus;
  address: string;
  createdAt: string;
  description: string;
};

async function fetchOrders(): Promise<OrderItem[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function ClientOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['client-orders-all'], queryFn: fetchOrders });

  return (
    <div className="space-y-6">
      <PageHeader
        title="طلباتي"
        description="تابع حالة جميع طلباتك مع الحرفيين"
        action={
          <Link href="/search">
            <Button>
              <Search className="size-4" />
              طلب جديد
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="لا توجد طلبات"
          description="لم تقم بإنشاء أي طلب بعد"
          action={
            <Link href="/search">
              <Button>
                <Search className="size-4" />
                ابحث عن حرفي
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => (
            <div key={o.id} className="flex flex-col gap-2">
              <OrderCard
                title={o.craftType}
                status={o.status}
                location={o.address}
                createdAt={new Date(o.createdAt).toLocaleDateString('ar-EG')}
              />
              <div className="px-1 text-xs text-gray-500 line-clamp-2">{o.description}</div>
              <div className="px-1">
                <OrderStatusBadge status={o.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
