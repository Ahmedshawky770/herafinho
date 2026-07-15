'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

export function ModerationForm({
  complaintId: _complaintId,
  onDecision,
}: {
  complaintId: string;
  onDecision?: (decision: string, note: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">اتخاذ قرار</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-right">
        <div className="space-y-2">
          <Label htmlFor="decision">القرار</Label>
          <Select
            id="decision"
            className="w-full"
            onChange={(e) => onDecision?.(e.target.value, '')}
          >
            <option value="">اختر القرار</option>
            <option value="resolve">حل الشكوى</option>
            <option value="dismiss">رفض الشكوى</option>
            <option value="ban">حظر الحرفي</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">ملاحظات</Label>
          <Textarea id="note" placeholder="ملاحظات إضافية" />
        </div>
        <Button type="button" className="w-full">
          تأكيد القرار
        </Button>
      </CardContent>
    </Card>
  );
}
