'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, EmptyState, ComplaintStatusBadge, COMPLAINT_REASONS } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Check, Search } from 'lucide-react';
import type { ComplaintStatus, ModerationAction } from '@herafino/types';

type Complaint = {
  id: string;
  reason: string;
  description: string;
  status: ComplaintStatus;
  againstUserId: string;
  createdAt: string;
};

async function fetchComplaints(): Promise<Complaint[]> {
  const res = await fetch('/api/admin/complaints');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

const ACTIONS: { value: ModerationAction; label: string }[] = [
  { value: 'warning', label: 'تحذير' },
  { value: 'freeze', label: 'تجميد' },
  { value: 'permanent_ban', label: 'حظر نهائي' },
];

export default function AdminComplaintsPage() {
  const queryClient = useQueryClient();
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: fetchComplaints,
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: ModerationAction }) =>
      fetch(`/api/admin/complaints/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      }).then((r) => {
        if (!r.ok) throw new Error('failed');
        return r.json();
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-complaints'] }),
  });

  const pending = complaints.filter((c) => c.status === 'pending' || c.status === 'investigating');

  return (
    <div className="space-y-6">
      <PageHeader
        title="الشكاوى"
        description={pending.length > 0 ? `${pending.length} شكوى تحتاج إجراءً` : 'جميع الشكاوى تم التعامل معها'}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="لا توجد شكاوى" description="ستظهر الشكاوى المقدمة من العملاء هنا" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {complaints.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base">
                    {COMPLAINT_REASONS[c.reason as keyof typeof COMPLAINT_REASONS] ?? c.reason}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-gray-500">{new Date(c.createdAt).toLocaleString('ar-EG')}</p>
                </div>
                <ComplaintStatusBadge status={c.status} />
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">{c.description}</p>
                <p className="text-xs text-gray-400">الطرف المشكو منه: {c.againstUserId.slice(0, 8)}…</p>

                {c.status === 'pending' || c.status === 'investigating' ? (
                  <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                    {ACTIONS.map((a) => (
                      <Button
                        key={a.value}
                        size="sm"
                        variant={a.value === 'permanent_ban' ? 'destructive' : 'outline'}
                        onClick={() => mutation.mutate({ id: c.id, action: a.value })}
                        disabled={mutation.isPending}
                      >
                        {a.value === 'permanent_ban' ? <ShieldAlert className="size-4" /> : <Check className="size-4" />}
                        {a.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border-t border-gray-100 pt-3 text-xs text-green-600">
                    <Search className="size-4" /> تم البت في الشكوى
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
