import { auth } from '@/app/auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

const CRAFT_TYPE_LABELS: Record<string, string> = {
  carpenter: 'نجار',
  plumber: 'سباك',
  painter: 'رسام',
  electrician: 'كهربائي',
  welder: 'لحام',
  tiler: 'بلاط',
  ceramicist: 'سيراميك',
  whitewasher: 'محار',
  hvac: 'تكييف',
  satellite: 'أقمار صناعية',
  aluminum: 'ألمنيوم',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'outline',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/unauthorized');
  }

  const params = await searchParams;
  const statusFilter = params.status || 'all';

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/admin/orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`, {
    cache: 'no-store',
  });
  const json = await res.json();
  const orders = (json.data ?? []) as Array<{
    id: string;
    craftType: string;
    status: string;
    address: string;
    createdAt: string;
    finalPrice?: string;
    estimatedPrice?: string;
    clientId: string;
    craftsmanId?: string;
    client?: { name: string };
    craftsman?: { name: string };
  }>;

  const counts: Record<string, number> = {};
  for (const order of orders) {
    counts[order.status] = (counts[order.status] || 0) + 1;
  }

  const filterOptions = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: STATUS_LABELS.pending },
    { value: 'accepted', label: STATUS_LABELS.accepted },
    { value: 'rejected', label: STATUS_LABELS.rejected },
    { value: 'in_progress', label: STATUS_LABELS.in_progress },
    { value: 'completed', label: STATUS_LABELS.completed },
    { value: 'cancelled', label: STATUS_LABELS.cancelled },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <ClipboardList className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
            <p className="text-sm text-gray-600">متابعة جميع الطلبات على المنصة وحالتها</p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <form method="GET" className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">الحالة:</label>
            <select
              id="status-filter"
              name="status"
              defaultValue={statusFilter}
              onFocus={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('status', 'all');
                e.target.value = 'all';
                window.location.href = url.toString();
              }}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('status', e.target.value);
                window.location.href = url.toString();
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </form>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <span key={key} className="rounded-full bg-gray-100 px-2 py-1">
                {label}: <span className="font-semibold">{counts[key] || 0}</span>
              </span>
            ))}
          </div>
        </div>

        <Card className="p-6">
          {orders.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              <ClipboardList className="size-5 text-gray-400" />
              <div>
                <p className="font-medium">لا توجد طلبات</p>
                <p className="mt-1 text-xs text-gray-400">لا توجد طلبات تطابق الفلتر المحدد</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="py-2 px-3 font-medium text-gray-700">#</th>
                    <th className="py-2 px-3 font-medium text-gray-700">العميل</th>
                    <th className="py-2 px-3 font-medium text-gray-700">الحرفي</th>
                    <th className="py-2 px-3 font-medium text-gray-700">نوع الحرفة</th>
                    <th className="py-2 px-3 font-medium text-gray-700">الحالة</th>
                    <th className="py-2 px-3 font-medium text-gray-700">العنوان</th>
                    <th className="py-2 px-3 font-medium text-gray-700">تاريخ الإنشاء</th>
                    <th className="py-2 px-3 font-medium text-gray-700">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-600">{order.id.slice(0, 8)}</td>
                      <td className="py-2 px-3 text-gray-600">{order.client?.name || order.clientId}</td>
                      <td className="py-2 px-3 text-gray-600">{order.craftsman?.name || order.craftsmanId || '-'}</td>
                      <td className="py-2 px-3 text-gray-600">{CRAFT_TYPE_LABELS[order.craftType] || order.craftType}</td>
                      <td className="py-2 px-3">
                        <Badge variant={STATUS_VARIANTS[order.status] || 'secondary'}>
                          {STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-gray-600 max-w-[200px] truncate">{order.address}</td>
                      <td className="py-2 px-3 text-gray-600">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</td>
                      <td className="py-2 px-3 text-gray-600">
                        {order.finalPrice ? `${order.finalPrice} ج.م` : order.estimatedPrice ? `${order.estimatedPrice} ج.م` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
