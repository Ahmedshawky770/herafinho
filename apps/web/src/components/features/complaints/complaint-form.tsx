'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

export function ComplaintForm({
  orderId,
  onSubmit,
}: {
  orderId: string;
  onSubmit?: (reason: string, details: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right flex items-center gap-2">
          <AlertTriangle className="size-5 text-red-500" />
          تقديم شكوى
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="space-y-2">
          <Label htmlFor="reason">سبب الشكوى</Label>
          <Select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full"
          >
            <option value="">اختر السبب</option>
            <option value="delay">تأخر في التنفيذ</option>
            <option value="quality">جودة العمل</option>
            <option value="behavior">سلوك الحرفي</option>
            <option value="price">السعر</option>
            <option value="other">أخرى</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="details">التفاصيل</Label>
          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="اشرح تفاصيل الشكوى"
          />
        </div>
        <Button
          type="button"
          className="w-full"
          disabled={!reason || !details}
          onClick={() => onSubmit?.(reason, details)}
        >
          إرسال الشكوى
        </Button>
      </CardContent>
    </Card>
  );
}
