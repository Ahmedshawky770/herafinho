'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader, EmptyState } from '@/components/features/common/ui';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

type AuditLog = {
  id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  actor?: { name?: string; role?: string } | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
};

async function fetchLogs(): Promise<{ data: AuditLog[]; meta: { total: number } }> {
  const res = await fetch('/api/admin/audit-logs?limit=50');
  if (!res.ok) return { data: [], meta: { total: 0 } };
  const json = await res.json();
  return json;
}

export default function AdminAuditLogsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-audit'], queryFn: fetchLogs });

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل التدقيق"
        description={`${data?.meta.total ?? 0} حدث مسجّل على المنصة`}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={FileText} title="لا يوجد سجل تدقيق بعد" />
      ) : (
        <div className="space-y-2">
          {data.data.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500">
                    {log.targetType ? `${log.targetType}` : ''} {log.targetId ? `· ${log.targetId.slice(0, 8)}…` : ''}
                  </p>
                  {log.actor && (
                    <p className="text-xs text-gray-400">
                      بواسطة: {log.actor.name ?? '—'} ({log.actor.role ?? '—'})
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString('ar-EG')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
