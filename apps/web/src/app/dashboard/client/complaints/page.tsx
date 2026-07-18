'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PageHeader,
  EmptyState,
  ComplaintStatusBadge,
  COMPLAINT_REASONS,
  BackLink,
} from '@/components/features/common/ui';
import { ComplaintTimeline } from '@/components/features/complaints/complaint-timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import type { ComplaintReason, ComplaintStatus } from '@herafino/types';

type ComplaintItem = {
  id: string;
  orderId?: string;
  reason: ComplaintReason;
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};

async function fetchMyComplaints(): Promise<ComplaintItem[]> {
  const res = await fetch('/api/complaints');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

const STATUS_NOTE: Record<ComplaintStatus, string> = {
  pending: 'تم استلام الشكوى وهي بانتظار المراجعة',
  investigating: 'يجري فريق الإدارة التحقيق في الشكوى',
  resolved: 'تمت معالجة الشكوى',
  dismissed: 'تم رفض الشكوى بعد المراجعة',
};

function buildTimeline(complaint: ComplaintItem) {
  const events = [
    {
      status: 'pending',
      note: STATUS_NOTE.pending,
      at: new Date(complaint.createdAt).toLocaleString('ar-EG'),
    },
  ];
  if (complaint.status !== 'pending') {
    events.push({
      status: complaint.status,
      note: STATUS_NOTE[complaint.status],
      at: new Date(complaint.resolvedAt ?? complaint.updatedAt).toLocaleString('ar-EG'),
    });
  }
  return events;
}

export default function ClientComplaintsPage() {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: fetchMyComplaints,
  });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/client" label="رجوع للرئيسية" />
      <PageHeader title="شكاوَيّ" description="تابع حالة الشكاوى التي قدّمتها" />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="لا توجد شكاوى"
          description="يمكنك تقديم شكوى من صفحة طلباتك عند وجود مشكلة"
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {complaints.map((c) => (
            <div key={c.id} className="space-y-3">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">{COMPLAINT_REASONS[c.reason]}</CardTitle>
                  <ComplaintStatusBadge status={c.status} />
                </CardHeader>
                <CardContent className="text-right text-sm text-gray-700">
                  <p>{c.description}</p>
                </CardContent>
              </Card>
              <ComplaintTimeline events={buildTimeline(c)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
