'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, EmptyState } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch('/api/notifications');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function markAllRead() {
  await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) });
}

export default function ClientNotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const mutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        description={unread > 0 ? `${unread} إشعار غير مقروء` : 'لا توجد إشعارات جديدة'}
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              <CheckCheck className="size-4" />
              تعليم الكل كمقروء
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="صندوق الإشعارات فارغ" description="ستصلك إشعارات عن حالة طلباتك هنا" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-4 transition-colors',
                n.read ? 'border-gray-100 bg-white' : 'border-primary/20 bg-primary/5',
              )}
            >
              <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg', n.read ? 'bg-gray-100 text-gray-400' : 'bg-primary/10 text-primary')}>
                <Bell className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-gray-900">{n.title}</p>
                  {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-sm text-gray-600">{n.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString('ar-EG')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
