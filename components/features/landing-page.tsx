'use client';

import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          حرفينو - Harfino
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          منصة ربط الحرفيين بالعملاء في مصر
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}