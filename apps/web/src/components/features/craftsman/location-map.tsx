'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { LiveMap, type MapMarker } from '@/components/features/common/live-map';

// Leaflet touches `window`, so render the map client-side only.
const LiveMapDynamic = dynamic(() => Promise.resolve(LiveMap), { ssr: false });

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 }; // Cairo

export function LocationMap({
  lat,
  lng,
  onChange,
  selectable = false,
}: {
  lat: number | null;
  lng: number | null;
  onChange?: (lat: number, lng: number) => void;
  selectable?: boolean;
}) {
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [marker, setMarker] = useState<MapMarker | null>(null);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setCenter({ lat, lng });
      setMarker({ id: 'loc', lat, lng, draggable: selectable, popup: 'موقعك' });
    }
  }, [lat, lng, selectable]);

  const markers: MapMarker[] = marker ? [marker] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <MapPin className="size-4 text-primary" />
          الموقع على الخريطة
        </CardTitle>
      </CardHeader>
      <CardContent className="text-right">
        {lat !== null && lng !== null ? (
          <LiveMapDynamic
            center={center}
            markers={markers}
            scrollWheelZoom
            onMarkerDragEnd={(_id: string, nlat: number, nlng: number) => {
              setMarker((m) => (m ? { ...m, lat: nlat, lng: nlng } : m));
              onChange?.(nlat, nlng);
            }}
          />
        ) : (
          <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
            <div className="text-center">
              <MapPin className="mx-auto mb-2 size-8 text-gray-400" />
              <p className="text-sm text-gray-500">
                {selectable ? 'اختر موقعك على الخريطة' : 'لم يتم تحديد الموقع بعد'}
              </p>
            </div>
          </div>
        )}
        {marker && (
          <p className="mt-2 text-xs text-gray-500">
            الإحداثيات: {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
