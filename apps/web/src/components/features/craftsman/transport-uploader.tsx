'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload } from 'lucide-react';

export function TransportUploader({
  onChange,
}: {
  onChange: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">صورة وسيلة النقل</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 text-right">
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => input.current?.click()}
        >
          <Upload className="ml-2 size-4" />
          اختر صورة
        </Button>
      </CardContent>
    </Card>
  );
}
