'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

export function ReviewQueue({
  items,
  onReview,
}: {
  items: { id: string; status: string; reason: string }[];
  onReview?: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">قائمة المراجعة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-right">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-md border p-3"
          >
            <div>
              <p className="font-medium">شكوى #{item.id}</p>
              <p className="text-xs text-gray-500">{item.reason}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview?.(item.id)}
            >
              <Eye className="ml-1 size-4" />
              مراجعة
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
