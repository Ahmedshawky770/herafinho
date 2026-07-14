import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  actor?: {
    name?: string;
  };
  actorId?: string;
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; targetType?: string; from?: string; to?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  const params = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const queryParams = new URLSearchParams();
  if (params.action) queryParams.set('action', params.action);
  if (params.targetType) queryParams.set('targetType', params.targetType);
  if (params.from) queryParams.set('from', params.from);
  if (params.to) queryParams.set('to', params.to);
  if (params.page) queryParams.set('page', params.page);

  const res = await fetch(`${baseUrl}/api/admin/audit-logs?${queryParams.toString()}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  const logs = (json.data ?? []) as AuditLog[];
  const meta = json.meta ?? { total: 0, page: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false };

  const actionOptions = [
    { value: '', label: 'كل الإجراءات' },
    { value: 'order.created', label: 'إنشاء طلب' },
    { value: 'order.accepted', label: 'قبول طلب' },
    { value: 'order.rejected', label: 'رفض طلب' },
    { value: 'order.in_progress', label: 'بدء تنفيذ' },
    { value: 'order.completed', label: 'إتمام طلب' },
    { value: 'order.cancelled', label: 'إلغاء طلب' },
    { value: 'craftsman.registered', label: 'تسجيل حرفي' },
    { value: 'craftsman.approved', label: 'موافقة حرفي' },
    { value: 'craftsman.rejected', label: 'رفض حرفي' },
    { value: 'craftsman.frozen', label: 'تجميد حرفي' },
    { value: 'craftsman.unfrozen', label: 'رفع تجميد' },
    { value: 'craftsman.banned', label: 'حظر حرفي' },
    { value: 'complaint.filed', label: 'تقديم شكوى' },
    { value: 'complaint.resolved', label: 'حل شكوى' },
    { value: 'complaint.dismissed', label: 'رفض شكوى' },
    { value: 'user.created', label: 'إنشاء مستخدم' },
    { value: 'user.updated', label: 'تحديث مستخدم' },
    { value: 'user.deleted', label: 'حذف مستخدم' },
    { value: 'webhook.created', label: 'إنشاء webhook' },
    { value: 'webhook.deleted', label: 'حذف webhook' },
  ];

  const buildUrl = (newParams: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    if (newParams.action) p.set('action', String(newParams.action));
    if (newParams.targetType) p.set('targetType', String(newParams.targetType));
    if (newParams.from) p.set('from', String(newParams.from));
    if (newParams.to) p.set('to', String(newParams.to));
    if (newParams.page) p.set('page', String(newParams.page));
    return `/dashboard/admin/audit-logs?${p.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">سجل التدقيق</h1>
            <p className="text-sm text-gray-600">جميع الإجراءات الإدارية والعمليات على المنصة</p>
          </div>
        </div>

        <Card className="mb-6 p-4">
          <form method="GET" className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">الإجراء</label>
              <select
                name="action"
                defaultValue={params.action || ''}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              >
                {actionOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">نوع الهدف</label>
              <input
                type="text"
                name="targetType"
                defaultValue={params.targetType || ''}
                placeholder="مثال: order"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">من تاريخ</label>
              <input
                type="date"
                name="from"
                defaultValue={params.from || ''}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">إلى تاريخ</label>
              <input
                type="date"
                name="to"
                defaultValue={params.to || ''}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              تطبيق
            </button>
          </form>
        </Card>

        <Card className="p-6">
          {logs.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              <History className="size-5 text-gray-400" />
              <div>
                <p className="font-medium">لا توجد سجلات تدقيق</p>
                <p className="mt-1 text-xs text-gray-400">لا توجد سجلات تطابق الفلتر المحدد</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="py-2 px-3 font-medium text-gray-700">الوقت</th>
                      <th className="py-2 px-3 font-medium text-gray-700">المسؤول</th>
                      <th className="py-2 px-3 font-medium text-gray-700">الإجراء</th>
                      <th className="py-2 px-3 font-medium text-gray-700">نوع الهدف</th>
                      <th className="py-2 px-3 font-medium text-gray-700">معرف الهدف</th>
                      <th className="py-2 px-3 font-medium text-gray-700">البيانات الإضافية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: AuditLog) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('ar-EG')}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {log.actor?.name || log.actorId || 'غير معروف'}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant="secondary">{log.action}</Badge>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{log.targetType}</td>
                        <td className="py-2 px-3 text-gray-600 font-mono text-xs">{log.targetId}</td>
                        <td className="py-2 px-3 text-gray-600 max-w-[200px] truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  إجمالي السجلات: {meta.total} | الصفحة {meta.page} من {meta.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={buildUrl({ page: meta.hasPreviousPage ? meta.page - 1 : undefined })}
                    className={`rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 ${!meta.hasPreviousPage ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    السابق
                  </a>
                  <a
                    href={buildUrl({ page: meta.hasNextPage ? meta.page + 1 : undefined })}
                    className={`rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 ${!meta.hasNextPage ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    التالي
                  </a>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
