import { Skeleton } from '@/components/ui/skeleton';

export default function CraftsmanProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Skeleton className="mx-auto h-64 max-w-3xl" />
    </div>
  );
}
