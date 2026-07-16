'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_ICON = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  popup?: string;
  draggable?: boolean;
}

function DraggableMarker({
  marker,
  onDragEnd,
}: {
  marker: MapMarker;
  onDragEnd?: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = useState({ lat: marker.lat, lng: marker.lng });
  const ref = useRef<L.Marker>(null);

  return (
    <Marker
      position={[pos.lat, pos.lng]}
      icon={DEFAULT_ICON}
      draggable={marker.draggable}
      ref={ref}
      eventHandlers={{
        dragend() {
          const m = ref.current;
          if (!m) return;
          const { lat, lng } = m.getLatLng();
          setPos({ lat, lng });
          onDragEnd?.(lat, lng);
        },
      }}
    >
      {marker.popup ? <Popup>{marker.popup}</Popup> : null}
    </Marker>
  );
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

export interface LiveMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  onMarkerDragEnd?: (id: string, lat: number, lng: number) => void;
  className?: string;
  scrollWheelZoom?: boolean;
}

export function LiveMap({
  center,
  zoom = 13,
  markers = [],
  onMarkerDragEnd,
  className,
  scrollWheelZoom = false,
}: LiveMapProps) {
  return (
    <div className={className ?? 'h-72 w-full overflow-hidden rounded-lg border border-gray-200'}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        className="h-full w-full"
        dir="ltr"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) =>
          m.draggable ? (
            <DraggableMarker
              key={m.id}
              marker={m}
              onDragEnd={(lat, lng) => onMarkerDragEnd?.(m.id, lat, lng)}
            />
          ) : (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={DEFAULT_ICON}>
              {m.popup ? <Popup>{m.popup}</Popup> : null}
            </Marker>
          )
        )}
        <Recenter lat={center.lat} lng={center.lng} />
      </MapContainer>
    </div>
  );
}

export { DEFAULT_ICON };
export default LiveMap;
