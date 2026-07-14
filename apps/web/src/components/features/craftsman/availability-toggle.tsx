'use client';

import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AvailabilityToggle({
  available,
  onToggle,
}: {
  available: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">حالة التوفر</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-right">
        <span className="text-sm text-gray-600">
          {available ? 'متاح لاستقبال الطلبات' : 'غير متاح حالياً'}
        </span>
        <Switch checked={available} onCheckedChange={onToggle} />
      </CardContent>
    </Card>
  );
}
