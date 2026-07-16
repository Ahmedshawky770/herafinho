'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Package, Search, Star, MapPin } from 'lucide-react';
import { PageHeader, StatCard, EmptyState } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { OrderCard } from '@/components/features/orders/order-card';
import Link from 'next/link';

async function fetchOrders(): Promise<{ id: string; craftType: string; status: string; address: string; createdAt: string }[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function ClientDashboard() {
  const { data: session } = useSession();
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['client-orders'], queryFn: fetchOrders });

  const active = orders.filter((o) => ['pending', 'accepted', 'in_progress'].includes(o.status)).length;
  const completed = orders.filter((o) => o.status === 'completed').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`مرحباً، ${session?.user?.name?.split(' ')[0] ?? 'بك'}`}
        description="إدارة طلباتك وتصفّح الحرفيين الموثوقين بالقرب منك"
        action={
          <Link href="/search">
            <Button>
              <Search className="size-4" />
              ابحث عن حرفي
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="إجمالي الطلبات" value={orders.length} icon={Package} />
        <StatCard label="طلبات نشطة" value={active} icon={MapPin} accent="secondary" />
        <StatCard label="طلبات مكتملة" value={completed} icon={Star} accent="muted" />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">أحدث طلباتك</h2>
          <Link href="/dashboard/client/orders" className="text-sm text-primary hover:underline">
            عرض الكل
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="لا توجد طلبات بعد"
            description="ابدأ بطلب خدمة من أحد الحرفيين الموثوقين في منطقتك"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {orders.slice(0, 4).map((o) => (
              <OrderCard
                key={o.id}
                title={o.craftType}
                status={o.status}
                location={o.address}
                createdAt={new Date(o.createdAt).toLocaleDateString('ar-EG')}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
