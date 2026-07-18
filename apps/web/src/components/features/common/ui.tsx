'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type {
  OrderStatus,
  CraftsmanStatus,
  ComplaintStatus,
  ComplaintReason,
} from '@herafino/types';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
}: {
  label: string;
  value: ReactNode;
  icon?: React.ElementType;
  accent?: 'primary' | 'secondary' | 'destructive' | 'muted';
}) {
  const accents = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    destructive: 'bg-red-50 text-red-600',
    muted: 'bg-gray-100 text-gray-600',
  } as const;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {Icon && (
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', accents[accent])}>
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
      {Icon && (
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="text-base font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-primary"
    >
      <ArrowRight className="size-4" />
      {label}
    </Link>
  );
}

const ORDER_STATUS: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'بانتظار القبول', variant: 'secondary' },
  accepted: { label: 'مقبول', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  in_progress: { label: 'قيد التنفيذ', variant: 'default' },
  completed: { label: 'مكتمل', variant: 'outline' },
  cancelled: { label: 'ملغي', variant: 'destructive' },
};

const CRAFTSMAN_STATUS: Record<CraftsmanStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'بانتظار المراجعة', variant: 'secondary' },
  approved: { label: 'موثّق', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
  frozen: { label: 'مجمّد', variant: 'outline' },
  banned: { label: 'محظور', variant: 'destructive' },
};

const COMPLAINT_STATUS: Record<ComplaintStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'معلّقة', variant: 'secondary' },
  investigating: { label: 'قيد التحقيق', variant: 'outline' },
  resolved: { label: 'تم الحل', variant: 'default' },
  dismissed: { label: 'مرفوضة', variant: 'destructive' },
};

export const COMPLAINT_REASONS: Record<ComplaintReason, string> = {
  no_show: 'عدم الحضور',
  bad_service: 'خدمة سيئة',
  overpriced: 'مبالغة في السعر',
  harassment: 'تحرش/إساءة',
  fraud: 'احتيال',
  other: 'أخرى',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function CraftsmanStatusBadge({ status }: { status: CraftsmanStatus }) {
  const s = CRAFTSMAN_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const s = COMPLAINT_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export const CRAFT_TYPE_LABELS: Record<string, string> = {
  carpenter: 'نجار',
  plumber: 'سباك',
  painter: 'دهان',
  electrician: 'كهربائي',
  welder: 'لحام',
  tiler: 'بلاط',
  ceramicist: 'سيراميك',
  whitewasher: 'بياض',
  hvac: 'تكييف',
  satellite: 'أطباق هوائية',
  aluminum: 'ألومنيوم',
};

export function craftTypeLabel(type: string): string {
  return CRAFT_TYPE_LABELS[type] ?? type;
}
