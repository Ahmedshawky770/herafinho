'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

const CRAFT_TYPES = [
  'سباك',
  'كهربائي',
  'نجار',
  'حداد',
  'مبلط',
  'دهان',
  'ميكانيكي',
  'تكييف وتبريد',
] as const;

export function CraftTypeSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">اختر نوع الحرفة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {CRAFT_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant={value === type ? 'default' : 'outline'}
              className="flex items-center gap-2"
              onClick={() => onChange(type)}
            >
              <Wrench className="size-4" />
              {type}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
