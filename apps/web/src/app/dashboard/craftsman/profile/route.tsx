import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { User, Phone, Briefcase, MapPin } from 'lucide-react';

export default async function CraftsmanProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'craftsman') {
    redirect('/unauthorized');
  }

  const name = session.user.name ?? 'الحرفي';

  const fields = [
    { label: 'الاسم', value: name, icon: User },
    { label: 'البريد الإلكتروني', value: session.user.email ?? '', icon: User },
    { label: 'الهاتف', value: 'غير مُحدد', icon: Phone },
    { label: 'الحرفة', value: 'غير مُحدد', icon: Briefcase },
    { label: 'الموقع', value: 'غير مُحدد', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
          <p className="mt-1 text-sm text-gray-600">إدارة معلوماتك الشخصية والمهنية</p>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-700">
              {name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{name}</h2>
              <p className="text-sm text-gray-500">حرفي مسجل</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <field.icon className="size-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">{field.label}</p>
                  <p className="text-sm font-medium">{field.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            تعديل الملف الشخصي في طور التطوير — ستتوفر here تعديل البيانات قريباً
          </div>
        </Card>
      </div>
    </div>
  );
}
