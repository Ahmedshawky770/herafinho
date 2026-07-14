import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { User, Search, ClipboardList, Star } from 'lucide-react';

export default async function ClientDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'client') {
    redirect('/unauthorized');
  }

  const name = session.user.name ?? 'العميل';

  const items = [
    {
      title: 'البحث عن حرفي',
      desc: 'تصفح الحرفيين المتاحين في منطقتك',
      href: '/',
      icon: Search,
    },
    {
      title: 'طلباتي',
      desc: 'متابعة الطلبات الحالية والسابقة',
      href: '/dashboard/client/orders',
      icon: ClipboardList,
    },
    {
      title: 'تقييماتي',
      desc: 'عرض وإدارة تقييماتك للخدمات',
      href: '/dashboard/client/reviews',
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم العميل</h1>
            <p className="text-sm text-gray-600">أهلاً {name} — ابدأ بالبحث عن حرفي أو تابع طلباتك</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.title} className="p-5">
              <div className="flex items-center gap-3">
                <item.icon className="h-6 w-6 text-primary" />
                <h2 className="text-lg font-semibold">{item.title}</h2>
              </div>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              <a
                href={item.href}
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted hover:text-foreground"
              >
                فتح
              </a>
            </Card>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          لوحة تحكم العميل في طور التطوير — ستتوفر هنا إدارة الطلبات والتقييمات قريباً
        </div>
      </div>
    </div>
  );
}
