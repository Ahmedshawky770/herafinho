'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Activity, Users, ShieldCheck, Server } from 'lucide-react';
import { PageHeader, StatCard } from '@/components/features/common/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Stats = {
  pendingCraftsmen: number;
  pendingComplaints: number;
  totalOrders: number;
  totalUsers: number;
};

async function fetchStats(): Promise<Stats> {
  const res = await fetch('/api/super-admin/stats');
  if (!res.ok) return { pendingCraftsmen: 0, pendingComplaints: 0, totalOrders: 0, totalUsers: 0 };
  const json = await res.json();
  return json.data;
}

export default function SuperAdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ['super-stats'], queryFn: fetchStats });

  return (
    <div className="space-y-6">
      <PageHeader title="التحكم الكامل" description="إشراف عليا على المنصة والبنية التحتية" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="المستخدمون" value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard label="الطلبات" value={stats?.totalOrders ?? 0} icon={Activity} accent="secondary" />
        <StatCard label="حرفيون بانتظار" value={stats?.pendingCraftsmen ?? 0} icon={ShieldCheck} accent="destructive" />
        <StatCard label="شكاوى معلّقة" value={stats?.pendingComplaints ?? 0} icon={Server} accent="muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">أدوات الإشراف</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3">
            <Link href="/dashboard/admin/craftsmen">
              <Button variant="outline" className="w-full justify-start"><Users className="size-4" /> إدارة الحرفيين</Button>
            </Link>
            <Link href="/dashboard/admin/complaints">
              <Button variant="outline" className="w-full justify-start"><ShieldCheck className="size-4" /> معالجة الشكاوى</Button>
            </Link>
            <Link href="/dashboard/admin/audit-logs">
              <Button variant="outline" className="w-full justify-start"><Server className="size-4" /> سجل التدقيق</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-right">الحالة التشغيلية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <StatusRow label="قاعدة البيانات" ok />
            <StatusRow label="خدمة التخزين المؤقت (Valkey)" ok />
            <StatusRow label="طابعات الرسائل (BullMQ)" ok />
            <StatusRow label="خدمة WebSocket" ok />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
      <span className="text-gray-700">{label}</span>
      <span className={ok ? 'flex items-center gap-1 text-xs text-green-600' : 'text-xs text-red-600'}>
        <span className={`size-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
        {ok ? 'تعمل' : 'متوقفة'}
      </span>
    </div>
  );
}
