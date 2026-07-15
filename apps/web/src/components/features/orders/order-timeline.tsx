'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, Circle } from 'lucide-react';

export function OrderTimeline({
  steps,
}: {
  steps: { title: string; description: string; completed: boolean }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">مراحل الطلب</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-3">
            <div className="mt-1">
              {step.completed ? (
                <CircleCheck className="size-5 text-green-600" />
              ) : (
                <Circle className="size-5 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{step.title}</p>
              <p className="text-sm text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
