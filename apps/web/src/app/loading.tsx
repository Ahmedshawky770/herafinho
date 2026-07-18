import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6" dir="rtl">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="mt-4 text-sm text-gray-500">جارٍ التحميل…</p>
    </div>
  );
}
