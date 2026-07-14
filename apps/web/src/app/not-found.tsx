import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6" dir="rtl">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">الصفحه غير موجوده</p>
        <Link href="/">
          <Button className="mt-4">
            <Home className="ms-2 size-4" />
            العوده للرئيسيه
          </Button>
        </Link>
      </div>
    </div>
  );
}
