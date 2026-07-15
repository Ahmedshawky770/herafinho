import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Users, ClipboardList, TriangleAlert, ShieldCheck, UserCheck } from 'lucide-react';

interface AdminStats {
  pendingCraftsmen: number;
  pendingComplaints: number;
  totalOrders: number;
  totalUsers: number;
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  const name = session.user.name ?? 'المسؤول';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let stats: AdminStats = {
    pendingCraftsmen: 0,
    pendingComplaints: 0,
    totalOrders: 0,
    totalUsers: 0,
  };

  try {
    const res = await fetch(`${baseUrl}/api/admin/stats`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      stats = json.data ?? stats;
    }
  } catch {
    // ignore fetch error, use default zeros
  }

  const statCards = [
    {
      title: 'طلبات التسجيل المعلقة',
      value: stats.pendingCraftsmen,
      icon: UserCheck,
      href: '/dashboard/admin/craftsmen',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'شكاوى معلقة',
      value: stats.pendingComplaints,
      icon: TriangleAlert,
      href: '/dashboard/admin/complaints',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders,
      icon: ClipboardList,
      href: '/dashboard/admin/orders',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'إجمالي المستخدمين',
      value: stats.totalUsers,
      icon: Users,
      href: '/dashboard/admin',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
  ];

  const managementCards = [
    {
      title: 'الحرفيون',
      desc: 'إدارة طلبات تسجيل الحرفيين، الموافقة، الرفض، التجميد والحظر',
      href: '/dashboard/admin/craftsmen',
      icon: Users,
    },
    {
      title: 'الطلبات',
      desc: 'متابعة جميع الطلبات على المنصة وحالتها',
      href: '/dashboard/admin/orders',
      icon: ClipboardList,
    },
    {
      title: 'الشكاوى',
      desc: 'مراجعة الشكاوى المقدمة من العملاء واتخاذ الإجراءات',
      href: '/dashboard/admin/complaints',
      icon: TriangleAlert,
    },
    {
      title: 'سجل التدقيق',
      desc: 'عرض سجل جميع الإجراءات الإدارية والعمليات',
      href: '/dashboard/admin/audit-logs',
      icon: ShieldCheck,
    },
    {
      title: 'Webhooks',
      desc: 'إدارة روابط الـ webhooks الخارجية',
      href: '/dashboard/admin/webhooks',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم المدير</h1>
            <p className="text-sm text-gray-600">أهلاً {name} — من هنا يمكنك إدارة المنصة</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <a key={stat.title} href={stat.href} className="block">
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-3 ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managementCards.map((card) => (
            <Card key={card.title} className="p-5">
              <div className="flex items-center gap-3">
                <card.icon className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold">{card.title}</h2>
              </div>
              <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              <a
                href={card.href}
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted hover:text-foreground"
              >
                فتح
              </a>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
