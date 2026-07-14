'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900">حدث خطأ ما!</h2>
      <Button onClick={() => reset()} className="mt-4">إعادة المحاولة</Button>
    </div>
  );
}
