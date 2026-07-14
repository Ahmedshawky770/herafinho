'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

export function ReviewForm({
  craftsmanId,
  onSubmit,
}: {
  craftsmanId: string;
  onSubmit?: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">تقييم الحرفي</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setRating(index + 1)}
              className="focus:outline-none"
            >
              <Star
                className={`size-6 ${
                  index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment"> التعليق</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شارك تجربتك مع الحرفي"
          />
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={rating === 0}
          onClick={() => onSubmit?.(rating, comment)}
        >
          إرسال التقييم
        </Button>
      </CardContent>
    </Card>
  );
}
