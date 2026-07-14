import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-6">
      <Skeleton className="mb-6 h-8 w-64" />
      <Skeleton className="h-6 w-full" />
    </div>
  );
}
