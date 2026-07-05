import { GoogleSignInButton } from '@/components/features/auth/google-signin-button';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">تسجيل الدخول</h1>
          <p className="mt-2 text-gray-600">ادخل باستخدام حساب Google</p>
        </div>

        <GoogleSignInButton />
      </div>
    </div>
  );
}