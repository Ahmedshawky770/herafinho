'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

export function ReviewCard({
  rating,
  comment,
  createdAt,
  reviewerName,
}: {
  rating: number;
  comment: string;
  createdAt?: string;
  reviewerName?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between text-right">
          <CardTitle className="text-base">{reviewerName ?? 'عميل'}</CardTitle>
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating}/5</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-right text-sm text-gray-700">
        <p>{comment}</p>
        {createdAt && (
          <p className="mt-2 text-xs text-gray-400">{createdAt}</p>
        )}
      </CardContent>
    </Card>
  );
}
