'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CircleCheck, Clock, TriangleAlert } from 'lucide-react';

export function ComplaintTimeline({
  events,
}: {
  events: { status: string; note: string; at: string }[];
}) {
  const iconMap: Record<string, typeof Clock> = {
    pending: Clock,
    investigating: TriangleAlert,
    resolved: CircleCheck,
    dismissed: Clock,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">تطورات الشكوى</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        {events.map((event, index) => {
          const Icon = iconMap[event.status] ?? Clock;
          return (
            <div key={index} className="flex gap-3">
              <div className="mt-1">
                <Icon className="size-5 text-gray-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{event.status}</p>
                <p className="text-sm text-gray-500">{event.note}</p>
                <p className="text-xs text-gray-400">{event.at}</p>
              </div>
              {index < events.length - 1 && <Separator className="my-2" />}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
