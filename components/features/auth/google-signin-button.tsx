'use client';

import { signIn } from 'next-auth/react';

export function GoogleSignInButton() {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/' })}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.52-.98 7.56-2.66l-3.57-2.77c-1.05.68-2.37.98-3.81.98-2.97 0-5.52-4.48-5.52-5.52s4.48-5.52 5.52-5.52c1.54 0 2.86.32 3.99.86l2.75-2.05C17.45 3.72 14.92 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c2.27 0 4.39-.75 6.16-2.08l-2.77-2.05C15.63 21.16 13.98 21.82 12 21.82 8.69 21.82 6 19.13 6 15.82 6 12.51 8.69 9.82 12 9.82 4.48 9.82 0 14.31 0 12s0-2.27-.86-3.99l2.75-2.05C6.14 5.72 8.67 5 12 5c2.97 0 5.52.98 7.56 2.66l-3.57 2.77c-.98-.76-2.2-.98-3.31-.98-2.97 0-5.52 3.55-5.52 5.52s2.55 5.52 5.52 5.52z"
        />
      </svg>
      <span>تسجيل الدخول بحساب Google</span>
    </button>
  );
}