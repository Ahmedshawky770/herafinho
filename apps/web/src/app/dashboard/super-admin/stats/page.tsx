'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Hammer, ClipboardList, ShieldAlert } from 'lucide-react';
import { PageHeader, StatCard, EmptyState } from '@/components/features/common/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Stats = {
  totalUsers: number;
  totalCraftsmen: number;
  totalOrders: number;
  totalComplaints: number;
};

async function fetchStats(): Promise<Stats> {
  const res = await fetch('/api/super-admin/stats');
  if (!res.ok) return { totalUsers: 0, totalCraftsmen: 0, totalOrders: 0, totalComplaints: 0 };
  const json = await res.json();
  return json.data;
}

export default function SuperAdminStatsPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['super-stats-detail'], queryFn: fetchStats });

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;

  return (
    <div className="space-y-6">
      <PageHeader title="إحصائيات المنصة" description="مؤشرات شاملة على مستوى النظام" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="إجمالي المستخدمين" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard label="الحرفيون" value={stats?.totalCraftsmen ?? 0} icon={Hammer} accent="secondary" />
        <StatCard label="الطلبات" value={stats?.totalOrders ?? 0} icon={ClipboardList} accent="muted" />
        <StatCard label="الشكاوى" value={stats?.totalComplaints ?? 0} icon={ShieldAlert} accent="destructive" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-right">توزيع المستخدمين</CardTitle>
        </CardHeader>
        <CardContent>
          {stats && stats.totalUsers > 0 ? (
            <div className="space-y-3">
              <Bar label="حرفيون" value={stats.totalCraftsmen} total={stats.totalUsers} color="bg-primary" />
              <Bar label="عملاء وإداريون" value={stats.totalUsers - stats.totalCraftsmen} total={stats.totalUsers} color="bg-secondary" />
            </div>
          ) : (
            <EmptyState icon={Users} title="لا توجد بيانات كافية" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{value} ({pct}%)</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
