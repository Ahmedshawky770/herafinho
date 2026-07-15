'use client';

import { MapPin, Wrench } from 'lucide-react';

export function CraftsmanMarker({
  id: _id,
  name,
  craftType,
  lat: _lat,
  lng: _lng,
  onClick,
}: {
  id: string;
  name: string;
  craftType: string;
  lat: number;
  lng: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-md transition hover:shadow-lg"
    >
      <MapPin className="size-4 text-red-500" />
      <div className="text-right">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-gray-500">{craftType}</p>
      </div>
      <Wrench className="size-3 text-gray-400" />
    </button>
  );
}
