'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader, EmptyState, BackLink } from '@/components/features/common/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MessageSquare } from 'lucide-react';

type ReviewItem = {
  id: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  orderDescription?: string;
};

async function fetchMyReviews(): Promise<ReviewItem[]> {
  const res = await fetch('/api/reviews/client');
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= rating ? 'size-4 fill-yellow-400 text-yellow-400' : 'size-4 text-gray-300'
          }
        />
      ))}
    </div>
  );
}

export default function ClientReviewsPage() {
  const { data: reviews = [], isLoading } = useQuery({ queryKey: ['my-reviews'], queryFn: fetchMyReviews });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/client" label="رجوع للرئيسية" />
      <PageHeader title="تقييماتي" description="التقييمات والمراجعات التي أضفتها للحرفيين" />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="لا توجد تقييمات بعد"
          description="بعد إتمام طلب، يمكنك تقييم الحرفي من صفحة الطلب"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">تقييم طلب</CardTitle>
                <Stars rating={r.rating} />
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {r.orderDescription && (
                  <p className="text-gray-600 line-clamp-2">{r.orderDescription}</p>
                )}
                {r.comment && <p className="text-gray-700">{r.comment}</p>}
                <p className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString('ar-EG')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
