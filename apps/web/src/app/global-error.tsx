'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
          <h2 className="text-2xl font-bold text-gray-900">حدث خطأ غير متوقع!</h2>
          <Button onClick={() => reset()} className="mt-4">إعادة المحاولة</Button>
        </div>
      </body>
    </html>
  );
}
