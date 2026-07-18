'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/features/common/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationMap } from '@/components/features/craftsman/location-map';
import { MapPin, LocateFixed, Save, Radio } from 'lucide-react';
import { useWS } from '@/components/providers/ws-provider';
import { useState } from 'react';

type Loc = { latitude: string; longitude: string; isAvailable: boolean };

async function fetchLocation(userId: string): Promise<Loc | null> {
  if (!userId) return null;
  const res = await fetch(`/api/locations/${userId}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export default function CraftsmanLocationPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';
  const { data, isLoading } = useQuery({
    queryKey: ['my-location', userId],
    queryFn: () => fetchLocation(userId),
    enabled: !!userId,
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() =>
    data ? { lat: Number(data.latitude), lng: Number(data.longitude) } : null
  );
  const [detecting, setDetecting] = useState(false);

  if (data && !coords && data.latitude && data.longitude) {
    setCoords({ lat: Number(data.latitude), lng: Number(data.longitude) });
  }

  const { isConnected, send } = useWS();

  const mutation = useMutation({
    mutationFn: async (body: { latitude: string; longitude: string }) => {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, isAvailable: true }),
      });
      if (!res.ok) throw new Error('failed');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-location', userId] }),
  });

  function detect() {
    setDetecting(true);
    if (!navigator.geolocation) {
      setDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setDetecting(false);
      },
      () => setDetecting(false),
    );
  }

  if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-100" />;

  return (
    <div className="space-y-6">
      <PageHeader title="موقعي المباشر" description="حدّد موقعك على الخريطة ليتمكن العملاء من رؤيتك" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LocationMap
            lat={coords ? coords.lat : null}
            lng={coords ? coords.lng : null}
            selectable
            onChange={(lat, lng) => setCoords({ lat, lng })}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right">
              <MapPin className="size-4 text-primary" />
              تحديد الموقع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={detect} disabled={detecting}>
              <LocateFixed className="size-4" />
              {detecting ? 'جارٍ التحديد…' : 'تحديد موقعي الحالي'}
            </Button>
            {coords && (
              <p className="rounded-lg bg-gray-50 p-3 text-center text-xs text-gray-600">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
            <Button
              className="w-full"
              disabled={!coords || mutation.isPending}
              onClick={() => coords && mutation.mutate({ latitude: String(coords.lat), longitude: String(coords.lng) })}
            >
              <Save className="size-4" />
              {mutation.isPending ? 'جارٍ الحفظ…' : 'حفظ الموقع'}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!coords || !isConnected}
              onClick={() =>
                coords &&
                send({
                  type: 'location:update',
                  payload: {
                    latitude: String(coords.lat),
                    longitude: String(coords.lng),
                    isAvailable: true,
                  },
                })
              }
            >
              <Radio className="size-4" />
              بث الموقع مباشرة
            </Button>
            {data?.isAvailable && (
              <p className="text-center text-xs text-green-600">أنت ظاهر الآن للعملاء</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
