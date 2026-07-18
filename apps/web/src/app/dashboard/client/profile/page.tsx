'use client';

import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/features/common/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { User, Mail, ShieldCheck, IdCard } from 'lucide-react';
import type { UserRole } from '@herafino/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مشرف',
  super_admin: 'مشرف عام',
  craftsman: 'حِرفي',
  client: 'عميل',
};

export default function ClientProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="space-y-6">
      <PageHeader title="ملفّي" description="بيانات حسابك في حرفينو" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <User className="size-4 text-primary" /> التفاصيل
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow icon={User} label="الاسم" value={user?.name ?? '—'} />
            <InfoRow icon={Mail} label="البريد الإلكتروني" value={user?.email ?? '—'} />
            <InfoRow icon={ShieldCheck} label="الدور" value={ROLE_LABELS[(user?.role as UserRole) ?? 'client']} />
            <InfoRow icon={IdCard} label="المعرّف" value={user?.id ?? '—'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-right">الصورة</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-4">
            <Avatar className="size-24">
              <img
                src={user?.image ?? undefined}
                alt={user?.name ?? ''}
                className="size-full rounded-full object-cover"
              />
            </Avatar>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-1 break-all font-medium text-gray-900">{value}</p>
    </div>
  );
}
