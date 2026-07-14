'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, MapPin } from 'lucide-react';

export function CraftsmanCard({
  name,
  craftType,
  rating,
  location,
  onClick,
}: {
  name: string;
  craftType: string;
  rating: number;
  location?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border p-4 text-right transition hover:shadow-md"
    >
      <CardHeader className="p-0">
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-2 text-right text-sm text-gray-600">
        <p>{craftType}</p>
        <div className="mt-1 flex items-center gap-1">
          <Star className="size-4 fill-yellow-400 text-yellow-400" />
          <span>{rating.toFixed(1)}</span>
        </div>
        {location && (
          <div className="mt-1 flex items-center gap-1">
            <MapPin className="size-4" />
            <span>{location}</span>
          </div>
        )}
      </CardContent>
    </button>
  );
}
