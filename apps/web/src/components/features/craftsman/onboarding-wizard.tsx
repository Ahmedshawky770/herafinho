'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CircleCheck, Circle } from 'lucide-react';

export function OnboardingWizard({ step, onNext: _onNext }: { step: number; onNext: () => void }) {
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-right">إعداد الحرفي</CardTitle>
        <Progress value={(step / 4) * 100} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="flex items-center gap-2">
          {step >= 1 ? <CircleCheck className="text-green-600" /> : <Circle className="text-gray-400" />}
          <span>المعلومات الشخصية</span>
        </div>
        <div className="flex items-center gap-2">
          {step >= 2 ? <CircleCheck className="text-green-600" /> : <Circle className="text-gray-400" />}
          <span>نوع الحرفة</span>
        </div>
        <div className="flex items-center gap-2">
          {step >= 3 ? <CircleCheck className="text-green-600" /> : <Circle className="text-gray-400" />}
          <span>الوثائق</span>
        </div>
        <div className="flex items-center gap-2">
          {step >= 4 ? <CircleCheck className="text-green-600" /> : <Circle className="text-gray-400" />}
          <span>الموقع وتأكيد الحساب</span>
        </div>
      </CardContent>
    </Card>
  );
}
