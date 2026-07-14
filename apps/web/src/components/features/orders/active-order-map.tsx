'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export function ActiveOrderMap({
  lat,
  lng,
  label,
}: {
  lat: number | null;
  lng: number | null;
  label?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">موقع الطلب النشط</CardTitle>
      </CardHeader>
      <CardContent className="text-right">
        <div className="flex h-72 items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 size-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              {lat !== null && lng !== null
                ? `${label ?? 'الموقع الحالي'}: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                : 'في انتظار بيانات الموقع'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
