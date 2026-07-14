'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, ClipboardList, Star, ShieldCheck, User, LogOut } from 'lucide-react';

const ROLE_ITEMS: Record<string, { title: string; items: { label: string; href: string; icon: React.ElementType }[] }> = {
  admin: {
    title: 'لوحة التحكم',
    items: [
      { label: 'الرئيسية', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'الحرفيون', href: '/dashboard/admin/craftsmen', icon: User },
      { label: 'الطلبات', href: '/dashboard/admin/orders', icon: ClipboardList },
      { label: 'الشكاوى', href: '/dashboard/admin/complaints', icon: ShieldCheck },
      { label: 'سجل التدقيق', href: '/dashboard/admin/audit-logs', icon: ShieldCheck },
      { label: 'Webhooks', href: '/dashboard/admin/webhooks', icon: ShieldCheck },
    ],
  },
  craftsman: {
    title: 'لوحة الحرفي',
    items: [
      { label: 'الرئيسية', href: '/dashboard/craftsman', icon: LayoutDashboard },
      { label: 'طلباتي', href: '/dashboard/craftsman/orders', icon: ClipboardList },
      { label: 'الملف الشخصي', href: '/dashboard/craftsman/profile', icon: User },
    ],
  },
  client: {
    title: 'لوحة العميل',
    items: [
      { label: 'الرئيسية', href: '/dashboard/client', icon: LayoutDashboard },
      { label: 'طلباتي', href: '/dashboard/client/orders', icon: ClipboardList },
      { label: 'تقييماتي', href: '/dashboard/client/reviews', icon: Star },
    ],
  },
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white md:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-100 p-4">
          <h1 className="text-lg font-bold text-primary">حرفينو</h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {ROLE_ITEMS.admin.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50', isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700')}>
                <span className="flex items-center gap-3">
                  <Icon className="size-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-3">
          <form action="/auth/signout" method="POST">
            <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50">
              <LogOut className="size-4" />
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
