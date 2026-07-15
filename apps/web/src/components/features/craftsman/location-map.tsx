'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export function LocationMap({
  lat,
  lng,
  onChange: _onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange?: (lat: number, lng: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">الموقع على الخريطة</CardTitle>
      </CardHeader>
      <CardContent className="text-right">
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 size-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              {lat !== null && lng !== null
                ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
                : 'لم يتم تحديد الموقع بعد'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
