'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center p-6" dir="rtl">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">حدث خطأ في لوحة التحكم</h2>
        <Button onClick={() => reset()} className="mt-4">إعادة المحاولة</Button>
      </div>
    </div>
  );
}
