'use client';

import { useSession } from 'next-auth/react';
import { useWS } from '@/components/providers/ws-provider';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import type { UserRole } from '@herafino/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مشرف',
  super_admin: 'مشرف عام',
  craftsman: 'حِرفي',
  client: 'عميل',
};


function WSStatus() {
  const { isConnected } = useWS();
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isConnected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
      }`}
      title={isConnected ? 'متصل بالخادم اللحظي' : 'غير متصل'}
    >
      <span className={`size-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
      {isConnected ? 'مباشر' : 'غير متصل'}
    </span>
  );
}

export function TopBar() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: UserRole } | undefined)?.role ?? 'client';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-primary">حرفينو</h1>
          <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:inline">
            {ROLE_LABELS[role]}
          </span>
          <WSStatus />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard/client/notifications" aria-label="الإشعارات">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute -top-0.5 -left-0.5 size-2 rounded-full bg-secondary" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
              <p className="mt-0.5 text-xs text-gray-500">{session?.user?.email}</p>
            </div>
            <Avatar className="size-9">
              <img
                src={session?.user?.image ?? ''}
                alt={session?.user?.name ?? ''}
                className="size-full rounded-full object-cover"
              />
            </Avatar>
          </div>
          <form action="/auth/signout" method="POST">
            <Button variant="ghost" size="icon" type="submit" aria-label="تسجيل الخروج">
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
