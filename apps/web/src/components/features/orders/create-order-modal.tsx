'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

export function CreateOrderModal({
  onClose: _onClose,
}: {
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="gap-2">
          <Plus className="size-4" />
          طلب جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right">إنشاء طلب جديد</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 text-right">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الطلب</Label>
            <Input id="title" placeholder="مثال: إصلاح تسريب ماء" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea id="description" placeholder="اشرح المشكلة بالتفصيل" />
          </div>
          <Button type="submit" className="w-full">
            إرسال الطلب
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
