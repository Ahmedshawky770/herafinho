import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6" dir="rtl">
      <ShieldX className="size-12 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900">غير مصرح</h1>
      <p className="mt-2 text-sm text-gray-600">ليس لديك صلاحيات للوصول لهذه الصفحه</p>
      <Link href="/">
        <Button variant="outline" className="mt-4">العوده للرئيسيه</Button>
      </Link>
    </div>
  );
}
