'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CraftsmanCard } from '@/components/features/search/craftsman-card';
import { Search } from 'lucide-react';

const MOCK = [
  { id: '1', name: 'أحمد محمد', craftType: 'سباك', rating: 4.5, location: 'القاهرة' },
  { id: '2', name: 'م Hassan علي', craftType: 'كهربائي', rating: 4.8, location: 'الجيزة' },
  { id: '3', name: 'كريم سعيد', craftType: 'نجار', rating: 4.2, location: 'الإسكندرية' },
];

export function CraftsmanSearch() {
  const [query, setQuery] = useState('');

  const filtered = MOCK.filter((item) =>
    item.name.includes(query) || item.craftType.includes(query),
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن حرفي..."
          className="text-right"
        />
        <Button type="button" variant="outline">
          <Search className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((item) => (
          <CraftsmanCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}
