'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

export function NearbyCraftsmenList({
  items,
}: {
  items: { id: string; name: string; distance: number; craftType: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">الحرفيون القريبون</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-right">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">{item.craftType}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="size-4" />
              <span>{item.distance.toFixed(1)} كم</span>
              <Badge variant="outline">قريب</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
