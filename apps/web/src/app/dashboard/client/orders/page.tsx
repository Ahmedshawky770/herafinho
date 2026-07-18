'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, OrderStatusBadge, EmptyState, BackLink } from '@/components/features/common/ui';
import { OrderCard } from '@/components/features/orders/order-card';
import { ComplaintForm } from '@/components/features/complaints/complaint-form';
import { ReviewForm } from '@/components/features/reviews/review-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { Package, Plus, TriangleAlert, Star } from 'lucide-react';
import type { ComplaintReason, OrderStatus } from '@herafino/types';

type OrderItem = {
  id: string;
  craftType: string;
  status: OrderStatus;
  address: string;
  createdAt: string;
  description: string;
  craftsmanId?: string | null;
};

async function fetchOrders(): Promise<OrderItem[]> {
  const res = await fetch('/api/orders');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function fetchReviewedOrderIds(): Promise<Set<string>> {
  const res = await fetch('/api/reviews/client');
  if (!res.ok) return new Set();
  const json = await res.json();
  const list: { orderId: string }[] = json.data ?? [];
  return new Set(list.map((r) => r.orderId));
}

function ComplaintDialog({ order }: { order: OrderItem }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ reason, details }: { reason: ComplaintReason; details: string }) => {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          againstUserId: order.craftsmanId,
          reason,
          description: details,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'تعذّر إرسال الشكوى');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
      setOpen(false);
    },
  });

  // A complaint requires a known craftsman to file against.
  if (!order.craftsmanId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full text-red-600">
            <TriangleAlert className="size-4" />
            تقديم شكوى
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">شكوى بخصوص الطلب</DialogTitle>
        </DialogHeader>
        <ComplaintForm
          orderId={order.id}
          isSubmitting={mutation.isPending}
          error={mutation.isError ? (mutation.error as Error).message : null}
          onSubmit={(reason, details) => mutation.mutate({ reason, details })}
        />
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({ order }: { order: OrderItem }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, rating, comment: comment || undefined }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? 'تعذّر إرسال التقييم');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviewed-order-ids'] });
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="w-full">
            <Star className="size-4" />
            تقييم الحرفي
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">تقييم الطلب</DialogTitle>
        </DialogHeader>
        <ReviewForm
          craftsmanId={order.craftsmanId ?? ''}
          onSubmit={(rating, comment) => mutation.mutate({ rating, comment })}
        />
        {mutation.isError && (
          <p className="px-1 text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ClientOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({ queryKey: ['client-orders-all'], queryFn: fetchOrders });
  const { data: reviewedOrderIds = new Set<string>() } = useQuery({
    queryKey: ['reviewed-order-ids'],
    queryFn: fetchReviewedOrderIds,
  });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/client" label="رجوع للرئيسية" />
      <PageHeader
        title="طلباتي"
        description="تابع حالة جميع طلباتك مع الحرفيين"
        action={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/client/complaints" className="text-sm text-primary hover:underline">
              شكاوَيّ
            </Link>
            <Link href="/orders/new">
              <Button>
                <Plus className="size-4" />
                طلب جديد
              </Button>
            </Link>
          </div>
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
            <Link href="/orders/new">
              <Button>
                <Plus className="size-4" />
                طلب خدمة جديدة
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
              {o.status === 'completed' && !reviewedOrderIds.has(o.id) && <ReviewDialog order={o} />}
              <ComplaintDialog order={o} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
