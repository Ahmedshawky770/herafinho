'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATS = [
  { label: 'إجمالي الحرفيين', value: '1,234' },
  { label: 'الطلبات النشطة', value: '567' },
  { label: 'الشكاوى المعلقة', value: '23' },
  { label: 'العملاء الجدد', value: '89' },
] as const;

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STATS.map((stat) => (
        <Card key={stat.label}>
          <CardHeader>
            <CardTitle className="text-right text-sm text-gray-500">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-right text-2xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
