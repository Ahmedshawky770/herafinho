'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, ClipboardList, ShieldAlert, Package } from 'lucide-react';
import { PageHeader, StatCard, EmptyState } from '@/components/features/common/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CraftsmanStatusBadge } from '@/components/features/common/ui';

type Stats = {
  pendingCraftsmen: number;
  pendingComplaints: number;
  totalOrders: number;
  totalUsers: number;
};

async function fetchStats(): Promise<Stats> {
  const res = await fetch('/api/admin/stats');
  if (!res.ok) return { pendingCraftsmen: 0, pendingComplaints: 0, totalOrders: 0, totalUsers: 0 };
  const json = await res.json();
  return json.data;
}

type PendingCraftsman = {
  id: string;
  userId: string;
  craftType: string;
  status: string;
  createdAt: string;
};

async function fetchPending(): Promise<PendingCraftsman[]> {
  const res = await fetch('/api/admin/craftsmen/pending');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

export default function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: fetchStats });
  const { data: pending = [] } = useQuery({ queryKey: ['admin-pending'], queryFn: fetchPending });

  return (
    <div className="space-y-6">
      <PageHeader title="لوحة الإدارة" description="إشراف شامل على المنصة والحرفيين والشكاوى" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="حرفيون بانتظار المراجعة" value={stats?.pendingCraftsmen ?? 0} icon={Users} accent="secondary" />
        <StatCard label="شكاوى معلّقة" value={stats?.pendingComplaints ?? 0} icon={ShieldAlert} accent="destructive" />
        <StatCard label="إجمالي الطلبات" value={stats?.totalOrders ?? 0} icon={Package} />
        <StatCard label="إجمالي المستخدمين" value={stats?.totalUsers ?? 0} icon={Users} accent="muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-right">حرفيون بانتظار التوثيق</CardTitle>
            <Link href="/dashboard/admin/craftsmen">
              <Button variant="outline" size="sm">عرض الكل</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <EmptyState icon={Users} title="لا يوجد حرفيون بانتظار المراجعة" />
            ) : (
              pending.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{c.craftType}</p>
                    <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <CraftsmanStatusBadge status={c.status as never} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-right">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            <Link href="/dashboard/admin/craftsmen">
              <Button variant="outline" className="w-full justify-start">
                <Users className="size-4" /> مراجعة الحرفيين
              </Button>
            </Link>
            <Link href="/dashboard/admin/complaints">
              <Button variant="outline" className="w-full justify-start">
                <ShieldAlert className="size-4" /> معالجة الشكاوى
              </Button>
            </Link>
            <Link href="/dashboard/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="size-4" /> متابعة الطلبات
              </Button>
            </Link>
            <Link href="/dashboard/admin/audit-logs">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="size-4" /> سجل التدقيق
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
