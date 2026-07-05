# Sequence Diagram - Realtime Location (WebSocket + Geolocation)

```mermaid
sequenceDiagram
    actor Craftsman as 🛠️ الحرفي (Browser)
    participant BrowserAPI as Browser Geolocation API
    participant WSS as WebSocket Server<br/>Next.js :3001
    participant Valkey as Valkey Cache
    participant PostgreSQL as PostgreSQL<br/>(craftsman_locations)
    participant ReactQuery as React Query<br/>(Client Cache)
    actor Clients as 👥 العملاء

    rect rgb(240, 253, 244)
        Note over Craftsman,ReactQuery: **تسجيل الحرفي للوضع المتاح**
    end

    Craftsman->>WSS: 1. WebSocket handshake<br/>(auth: token in query/handshake)
    WSS->>Valkey: 2. Verify JWT session
    Valkey-->>WSS: 3. { userId, role: 'craftsman', exp }

    rect rgb(255, 251, 240)
        Note over WSS,Craftsman: **طلب صلاحية تحديد الموقع**
    end

    WSS-->>Craftsman: 4. { type: 'request_permission', reason: 'enable_location' }

    Craftsman->>BrowserAPI: 5. getUserCurrentPosition()<br/>(high accuracy, timeout=10s)
    BrowserAPI-->>Craftsman: 6. { lat, lng, accuracy, timestamp }

    rect rgb(239, 246, 255)
        Note over Craftsman,PostgreSQL: **تحديث الموقع (كل 5-10s)**
    end

    loop كل 5-10 ثواني (بينما status='available')
        Craftsman->>BrowserAPI: 7. watchPosition(callback, error, options)
        BrowserAPI-->>Craftsman: 8. Position {lat, lng, accuracy, heading, speed}

        Craftsman->>WSS: 9. WS Message<br/>{ type: 'location_update', lat, lng, timestamp, available: true }

        WSS->>Valkey: 10. SET craftsman:location:{userId} = { lat, lng, is_online: true, updated_at }
        Valkey-->>WSS: 11. OK (TTL: 60s for keepalive)

        WSS->>PostgreSQL: 12. UPSERT craftsman_locations<br/>(lat, lng, last_updated, is_available)
        Nota: "Atomic: Both Valkey + PostgreSQL updated in transaction"

        WSS->>WSS: 13. Broadcast to room: 'craftsman:{userId}'
        WSS-->>Clients: 14. { type: 'location_broadcast', userId, lat, lng, available }
    end

    rect rgb(253, 232, 232)
        Note over WSS,PostgreSQL: **الحرفي يصبح "غير متاح"**
    end

    Craftsman->>WSS: 15. { type: 'status_change', is_available: false }
    WSS->>Valkey: 16. SET craftsman:location:{userId} = { is_online: false, updated_at }
    WSS->>PostgreSQL: 17. UPDATE craftsman_locations SET is_available = false
    WSS-->>Clients: 18. { type: 'status_change', userId, available: false }

    rect rgb(220, 38, 38)
        Note over WSS,PostgreSQL: **انقطاع الاتصال (Disconnect)**
    end

    WSS-->>WSS: 19. Connection closed (WS Close)
    WSS->>Valkey: 20. DEL craftsman:location:{userId}
    WSS->>PostgreSQL: 21. UPDATE craftsman_locations SET is_available = false, last_updated = NOW()
    WSS-->>All: 22. Broadcast disconnect to all connected clients

    rect rgb(254, 243, 199)
        Note over PostgreSQL,ReactQuery: **جلب البيانات للعملاء (Pull via React Query)**
    end

    Clients->>ReactQuery: 23. useQuery(['craftsmenNearby', { lat, lng }])
    ReactQuery->>Valkey: 24. GET craftsmen:nearby:{lat}:{lng}
    alt Cache Hit (Valkey)
        Valkey-->>ReactQuery: 25a. Cached list (TTL: 2m)
    else Cache Miss (PostgreSQL)
        ReactQuery->>PostgreSQL: 25b. SELECT + PostGIS ST_DWithin query<br/>(within 5km radius)
        PostgreSQL-->>ReactQuery: 26b. Nearby craftsmen list
        ReactQuery->>Valkey: 27b. SET craftsmen:nearby:{lat}:{lng} = list (TTL: 2m)
    end
    ReactQuery-->>Clients: 28. Render list on map
```

---

## WebSocket Server Implementation (Next.js Route Handler)

```typescript
// apps/web/src/app/api/ws/location/route.ts
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '@/lib/auth/jwt';

const wss = new WebSocketServer({ noServer: true });

interface LocationMessage {
  type: 'location_update' | 'status_change';
  lat: string;
  lng: string;
  timestamp: number;
  available?: boolean;
}

const rooms = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws: WebSocket, req) => {
  const token = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('token');
  const payload = verifyToken(token!);

  if (!payload || payload.role !== 'craftsman') {
    ws.close(4001, 'Unauthorized');
    return;
  }

  const userId = payload.sub;
  const room = `craftsman:${userId}`;

  ws.on('message', async (data) => {
    try {
      const message: LocationMessage = JSON.parse(data.toString());

      if (message.type === 'location_update') {
        await updateCraftsmanLocation(userId, message.lat, message.lng, message.available!);
        broadcastToRoom(room, {
          type: 'location_broadcast',
          userId,
          lat: message.lat,
          lng: message.lng,
          available: message.available!,
        });
      } else if (message.type === 'status_change') {
        await updateAvailability(userId, message.available!);
        broadcastToRoom(room, {
          type: 'status_change',
          userId,
          available: message.available!,
        });
      }
    } catch (error) {
      console.error('WS message error:', error);
    }
  });

  ws.on('close', async () => {
    await markAsOffline(userId);
    broadcastToRoom(room, { type: 'disconnect', userId });
  });

  // Add to room
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room)!.add(ws);
});
```

---

## Client-Side WebSocket Hook (React Query + React)

```typescript
// features/locations/hooks/use-craftsman-location-websocket.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCraftsman } from '@/features/craftsman/hooks/use-craftsman';

export function useCraftsmanLocationWebSocket(userId: string) {
  const ws = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeout = useRef<number>();

  const connect = useCallback(() => {
    const token = getSessionToken(); // Get from NextAuth client
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS connected');
      // Request location updates
      ws.current!.send(JSON.stringify({ type: 'subscribe', userId }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'location_broadcast' && data.userId === userId) {
        queryClient.setQueryData(['craftsmanLocation', userId], {
          lat: data.lat,
          lng: data.lng,
          available: data.available,
          updatedAt: Date.now(),
        });
      } else if (data.type === 'status_change' && data.userId === userId) {
        queryClient.setQueryData(['craftsmanStatus', userId], data.available);
      }
    };

    ws.current.onclose = () => {
      console.log('WS closed, reconnecting in 3s...');
      reconnectTimeout.current = window.setTimeout(connect, 3000);
    };

    ws.current.onerror = (err) => {
      console.error('WS error:', err);
    };
  }, [userId, queryClient]);

  useEffect(() => {
    connect();

    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              type: 'location_update',
              lat: pos.coords.latitude.toString(),
              lng: pos.coords.longitude.toString(),
              timestamp: pos.timestamp,
              available: true,
            }));
          }
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        clearTimeout(reconnectTimeout.current);
        ws.current?.close();
      };
    }
  }, [connect]);
}
```

---

## Geolocation Options

| Option | Value | Reason |
|--------|-------|--------|
| **enableHighAccuracy** | `true` | GPS + Wi-Fi triangulation |
| **timeout** | 10,000 ms | Don't wait too long |
| **maximumAge** | 0 | Always get fresh data |
| **distanceFilter** | N/A (handled by WS interval) | We send every 5-10s |
| **fallback** | IP Geolocation | When GPS blocked (permission denied) |
| **accuracy range** | 5-50m (GPS) vs 100-500m (IP) | Quality indicator for clients |

---

## Fallback Mechanism (Polling)

```typescript
// Fallback if WebSocket fails or permission denied
function useCraftsmanLocationFallback(userId: string, intervalMs = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!navigator.geolocation) return;

    const interval = setInterval(async () => {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        });
        queryClient.setQueryData(['craftsmanLocation', userId], {
          lat: pos.coords.latitude.toString(),
          lng: pos.coords.longitude.toString(),
          accuracy: pos.coords.accuracy,
          available: true,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn('Fallback location failed:', err);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [userId, queryClient]);
}
```

---

## Security Considerations

| Threat | Mitigation |
|--------|------------|
| **Fake Location Data** | Rate limit (1 update per 5s max per user) |
| **Impersonation** | JWT in WS handshake; reject non-craftsman role |
| **Replay Attack** | Timestamp + nonce in message; discard old (>30s) messages |
| **Location Privacy** | Only share when `available = true`; clients see only when craftsman agrees |
| **DDoS via WS** | Connection limit per IP; close after N messages without auth |
| **Data Leakage** | End-to-end encryption (optional); or TLS (wss://) |

---

## Valkey Keys (Location)

| Key | Type | TTL | Purpose |
|-----|------|-----|---------|
| `craftsman:location:{userId}` | String (JSON) | 60s (heartbeat) | Current location + availability |
| `craftsman:online:{userId}` | Boolean | 30s | Online status indicator |
| `room:craftsman:{userId}` | Pub/Sub channel | Dynamic | WebSocket room for broadcast |
| `craftsman:nearby:{lat}:{lng}` | String (JSON Array) | 120s | Geohash-based nearby list |

---

## Events Published

```typescript
// Domain Event: CraftsmanLocationUpdatedEvent
interface CraftsmanLocationUpdatedEvent {
  eventId: string;
  occurredAt: Date;
  userId: string;
  lat: string;
  lng: string;
  available: boolean;
  accuracy: number;
}
```

---

## PostgreSQL Upsert (Atomic Update)

```sql
INSERT INTO craftsman_locations (user_id, latitude, longitude, last_updated, is_available)
VALUES ($1, $2, $3, NOW(), $4)
ON CONFLICT (user_id)
DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  last_updated = NOW(),
  is_available = EXCLUDED.is_available;
```

---

## Related Documents
- [Data Flow - Onboarding](data-flow-onboarding.md)
- [Caching Strategy](caching-strategy.md)
- [ERD](erd.md)
- [C4 L2 - Container](c4-l2-container-deployment.md)
- [Plan](plan.md)
