import { PageHeader } from '@/components/features/common/ui';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center" dir="rtl">
      <PageHeader title="أنت غير متصل" description="تحقق من اتصالك بالإنترنت وحاول مرة أخرى" />
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
