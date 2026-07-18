'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { COMPLAINT_REASONS } from '@/components/features/common/ui';
import { TriangleAlert } from 'lucide-react';
import type { ComplaintReason } from '@herafino/types';

export function ComplaintForm({
  orderId: _orderId,
  onSubmit,
  isSubmitting = false,
  error,
}: {
  orderId: string;
  onSubmit?: (reason: ComplaintReason, details: string) => void;
  isSubmitting?: boolean;
  error?: string | null;
}) {
  const [reason, setReason] = useState<'' | ComplaintReason>('');
  const [details, setDetails] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2">
          <TriangleAlert className="size-5 text-red-500" />
          تقديم شكوى
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="space-y-2">
          <Label htmlFor="reason">سبب الشكوى</Label>
          <Select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ComplaintReason)}
            className="w-full"
          >
            <option value="">اختر السبب</option>
            {(Object.entries(COMPLAINT_REASONS) as [ComplaintReason, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="details">التفاصيل</Label>
          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="اشرح تفاصيل الشكوى (10 أحرف على الأقل)"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="button"
          className="w-full"
          disabled={!reason || details.trim().length < 10 || isSubmitting}
          onClick={() => reason && onSubmit?.(reason, details)}
        >
          {isSubmitting ? 'جارٍ الإرسال…' : 'إرسال الشكوى'}
        </Button>
      </CardContent>
    </Card>
  );
}
