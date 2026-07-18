'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import {
  LayoutDashboard,
  ClipboardList,
  Star,
  ShieldCheck,
  User,
  LogOut,
  Hammer,
  MapPin,
  FileText,
  Bell,
  Home,
  Webhook,
  UserPlus,
} from 'lucide-react';
import type { UserRole } from '@herafino/types';

type NavItem = { label: string; href: string; icon: React.ElementType };

const ROLE_ITEMS: Record<UserRole, { title: string; items: NavItem[] }> = {
  admin: {
    title: 'إدارة المنصة',
    items: [
      { label: 'الرئيسية', href: '/dashboard/admin', icon: LayoutDashboard },
      { label: 'الحرفيون', href: '/dashboard/admin/craftsmen', icon: User },
      { label: 'الطلبات', href: '/dashboard/admin/orders', icon: ClipboardList },
      { label: 'الشكاوى', href: '/dashboard/admin/complaints', icon: ShieldCheck },
      { label: 'سجل التدقيق', href: '/dashboard/admin/audit-logs', icon: FileText },
      { label: 'Webhooks', href: '/dashboard/admin/webhooks', icon: Webhook },
    ],
  },
  super_admin: {
    title: 'التحكم الكامل',
    items: [
      { label: 'الرئيسية', href: '/dashboard/super_admin', icon: LayoutDashboard },
      { label: 'الإحصائيات', href: '/dashboard/super_admin/stats', icon: Star },
      { label: 'الحرفيون', href: '/dashboard/admin/craftsmen', icon: User },
      { label: 'الشكاوى', href: '/dashboard/admin/complaints', icon: ShieldCheck },
      { label: 'Webhooks', href: '/dashboard/admin/webhooks', icon: Webhook },
    ],
  },
  craftsman: {
    title: 'لوحة الحرفي',
    items: [
      { label: 'الرئيسية', href: '/dashboard/craftsman', icon: LayoutDashboard },
      { label: 'إعداد الحساب', href: '/dashboard/craftsman/onboarding', icon: UserPlus },
      { label: 'طلباتي', href: '/dashboard/craftsman/orders', icon: ClipboardList },
      { label: 'موقعي', href: '/dashboard/craftsman/location', icon: MapPin },
      { label: 'الملف الشخصي', href: '/dashboard/craftsman/profile', icon: User },
    ],
  },
  client: {
    title: 'لوحة العميل',
    items: [
      { label: 'الرئيسية', href: '/dashboard/client', icon: Home },
      { label: 'ابحث عن حرفي', href: '/search', icon: Hammer },
      { label: 'طلباتي', href: '/dashboard/client/orders', icon: ClipboardList },
      { label: 'تقييماتي', href: '/dashboard/client/reviews', icon: Star },
      { label: 'الإشعارات', href: '/dashboard/client/notifications', icon: Bell },
    ],
  },
};

export function SidebarContent({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const config = ROLE_ITEMS[role] ?? ROLE_ITEMS.client;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 p-4">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
          ح
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none text-primary">حرفينو</h1>
          <p className="mt-0.5 text-xs text-gray-500">{config.title}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {config.items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-gray-700 hover:bg-gray-50',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-4" />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <aside className="hidden w-64 shrink-0 border-l border-gray-200 md:block">
      <SidebarContent role={user.role as UserRole} />
    </aside>
  );
}
