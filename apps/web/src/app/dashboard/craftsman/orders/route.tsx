import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { ClipboardList, Clock, CircleCheck, CircleX } from 'lucide-react';

export default async function CraftsmanOrdersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'craftsman') {
    redirect('/unauthorized');
  }

  const stats = [
    { label: 'طلبات جديدة', value: '0', icon: ClipboardList, color: 'text-blue-600' },
    { label: 'قيد التنفيذ', value: '0', icon: Clock, color: 'text-amber-600' },
    { label: 'مكتملة', value: '0', icon: CircleCheck, color: 'text-green-600' },
    { label: 'ملغاة', value: '0', icon: CircleX, color: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">طلباتي</h1>
          <p className="mt-1 text-sm text-gray-600">متابعة وإدارة جميع طلبات الخدمة</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`size-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          صفحة إدارة الطلبات في طور التطوير — ستتوفر هنا قائمة الطلبات وتفاصيل كل طلب قريباً
        </div>
      </div>
    </div>
  );
}
