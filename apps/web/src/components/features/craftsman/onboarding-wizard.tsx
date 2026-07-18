'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CircleCheck, Circle } from 'lucide-react';

const STEPS = [
  { label: 'المعلومات الشخصية', hint: 'نوع الحرفة وسنوات الخبرة' },
  { label: 'العنوان والوثائق', hint: 'عنوان الورشة وصور الهوية' },
  { label: 'الموقع وتأكيد الحساب', hint: 'تحديد الموقع وإرسال للمراجعة' },
];

export function OnboardingWizard({ step }: { step: number }) {
  const current = Math.min(Math.max(step, 1), STEPS.length);
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-right">إعداد الحرفي</CardTitle>
        <Progress value={(current / STEPS.length) * 100} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        {STEPS.map((s, i) => {
          const done = i + 1 < current;
          const active = i + 1 === current;
          return (
            <div
              key={s.label}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${active ? 'bg-primary/5' : ''}`}
            >
              {done ? (
                <CircleCheck className="text-green-600" />
              ) : (
                <Circle className={active ? 'text-primary' : 'text-gray-400'} />
              )}
              <div>
                <span className={active ? 'font-medium text-primary' : 'text-gray-700'}>{s.label}</span>
                <p className="text-xs text-gray-400">{s.hint}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
