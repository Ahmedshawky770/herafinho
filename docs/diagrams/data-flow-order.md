# Data Flow Diagram - Order Lifecycle

```mermaid
flowchart TD
    Start([طالب حرفة - Client]) --> Search[يبحث عن حرفي<br/>بالنوع + الموقع الجغرافي]

    Search --> QueryCache[فحص Valkey Cache<br/>craftsmen:nearby:{lat}:{lng}]
    QueryCache -->|Cache Hit| ReturnCached[إرجاع قائمة من Valkey<br/>TTL: 2 دقيقة]
    QueryCache -->|Cache Miss| QueryDB[استعلام PostgreSQL<br/>PostGIS ST_DWithin + Index]
    QueryDB --> UpdateCache[كاش Valkey + إرجاع]
    UpdateCache --> SelectCraftsman[Client يختار حرفي من القائمة]

    SelectCraftsman --> CreateOrder[إنشاء Order<br/>المستخدم الكاذب/المريض<br/>CreateOrderUC]
    CreateOrder --> Validate[Validate مع Zod<br/>status = 'pending']
    Validate -->|non-valid| ReturnError[عرض أخطاء]<-->CreateOrder
    Validate -->|valid| SaveOrder[INSERT into orders<br/>status = pending]

    SaveOrder --> NotifyCraftsman[إشعار الحرفي<br/>In-app + Email]
    NotifyCraftsman --> CraftsmanAccepts{الحرفي يقبل/يرفض?}
    NotifyCraftsman --> Timer[48-Hour Timeout<br/>الطوّل تتلقى رفض تلقائي]

    CraftsmanAccepts -->|Accepts| AcceptOrder[AcceptOrderUC<br/>status = 'accepted']
    CraftsmanAccepts -->|Rejects| RejectOrder[status = 'rejected']
    CraftsmanAccepts -->|Timeout| AutoReject[Auto-reject<br/>status = 'rejected']

    RejectOrder --> NotifyClient[إشعار العميل<br/>تم رفض الطلب]
    AutoReject --> NotifyClient

    AcceptOrder --> NotifyClientAccepted[إشعار العميل<br/>تم قبول الطلب]
    NotifyClientAccepted --> StartWork[الحرفي ينتقل لموقع العميل<br/>→ location: in_progress + realtime]
    StartWork --> ProgressUpdate[Ticker 1: Realtime location updates<br/>every 5-10s<br/>PCR]

    rect rgb(240, 253, 244)
        subgraph "Real-time Tracking"
            ProgressUpdate
            WSStream[WS Broadcast: lat, lng, heading, speed]
            ClientSees[Client sees craftsman on map]
            ETA[Calculated ETA based on distance]
        end
    end

    ProgressUpdate --> WSStream --> ClientSees --> ETA

    ETA --> JobComplete[الحرفي يكلم العميل<br/>Job completion]
    JobComplete --> MarkComplete[CompleteOrderUC<br/>status = 'completed'<br/>final_price set]
    MarkComplete --> SendReview[إرسال Review Request<br/>للعميل]
    SendReview --> ClientReviews[Client يقيّم<br/>1-5 نجوم + comment]

    ClientReviews --> SaveReview[INSERT reviews<br/>Update craftsman rating]
    SaveReview --> RatingUpdate[تحديث Aggregated Rating<br/>Craftsman reputation]

    rect rgb(255, 251, 240)
        subgraph "Post-Completion"
            RatingUpdate
            PaymentRelease[Release payment (future)]
        end
    end

    RatingUpdate --> End([النهاية])

    style Start fill:#10b981,color:white
    style AcceptOrder fill:#10b981,color:white
    style RejectOrder fill:#ef4444,color:white
    style AutoReject fill:#ef4444,color:white
    style JobComplete fill:#3b82f6,color:white
```

---

## Order States & Transitions

```
┌─────┐       accept       ┌───────┐    in_progress     ┌──────┐
│pending├─────────────────►│accepted│───────────────────►│completed│
└─────┘                   └───────┘                     └──────┘
     │                       │                               │
     │reject                 │reject                        │
     └──────────────────────►└───────┘                       │
     │                       │                               │
     │timeout (48h)          │cancel                         │complete
     ▼                       ▼                               ▼
┌─────────┐              ┌────────┐                    ┌────────┘
│rejected │              │cancelled│                   │
└─────────┘              └────────┘                    │
     ▲                       ▲                         │
     │                       └─────────────────────────┘
     │cancel
```

---

## Database Sequence

```typescript
// features/orders/use-cases/create-order.usecase.ts
export async function createOrder(dto: CreateOrderDto, clientId: string): Promise<Order> {
  const session = await db.transaction();

  try {
    // 1. Validate craftsman is available
    const craftsman = await session
      .select()
      .from(craftsmanProfiles)
      .where(
        and(
          eq(craftsmanProfiles.userId, dto.craftsmanId),
          eq(craftsmanProfiles.status, 'approved'),
          eq(craftsmanProfiles.isAvailable, true)
        )
      );

    if (!craftsman) throw new ConflictError('Craftsman not available');

    // 2. Create order
    const order = await session.insert(orders).values({
      clientId,
      craftsmanId: dto.craftsmanId,
      craftType: dto.craftType,
      description: dto.description,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      estimatedPrice: dto.estimatedPrice?.toString(),
      status: 'pending',
    });

    // 3. Publish event
    await eventBus.publish(new OrderCreatedEvent({
      orderId: order.id,
      clientId,
      craftsmanId: dto.craftsmanId,
    }));

    // 4. Send notification to craftsman
    await notificationService.send({
      userId: dto.craftsmanId,
      type: 'in_app",
      title: 'طلب خدمة جديد",
      body: `لديك طلب خدمة جديدة من ${client.name}`,
    });

    await session.commit();
    return order;
  } catch (error) {
    await session.rollback();
    throw error;
  }
}
```

---

## Reactive Status Flow

```
Status: pending
  └─→ Craftsman accepts → status = 'accepted'
      └─→ Realtime location tracking begins
          └─→ Craftsman in progress
              └─→ Job complete → status = 'completed'
                  └─→ Review request sent to client
                      └─→ Client rates → rating updated

Status: pending
  └─→ Craftsman rejects → status = 'rejected'
  └─→ Timeout (48h) → status = 'rejected'

Status: accepted
  └─→ Craftsman cancels (cancellable until pickup) → status = 'cancelled'
  └─→ Timeout (cancellation window) → status = 'cancelled'

Status: completed
  └─→ Status is final; cannot be changed back
```

---

## React Query Mutations

```typescript
// features/orders/hooks/use-create-order.ts
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOrderDto) => createOrder(dto, getCurrentUserId()),
    onSuccess: (order) => {
      queryClient.invalidateQueries(['orders', 'pending']);
      queryClient.invalidateQueries(['craftsman', order.craftsmanId]);
      toast.success('تم إنشاء الطلب بنجاح');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// features/orders/hooks/use-accept-order.ts
export function useAcceptOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId }: { orderId: string }) => acceptOrder(orderId),
    onSuccess: (order) => {
      queryClient.invalidateQueries(['orders', order.id]);
      queryClient.invalidateQueries(['orders', 'pending']);
      queryClient.setQueryData(['craftsmanStatus', order.craftsmanId], false);
    },
  });
}
```

---

## Timeouts & Auto-Retry Rules

| State | Timeout | Action |
|-------|---------|--------|
| **pending** | 48 hours | Auto-reject if craftsman doesn't respond |
| **accepted** | Before pickup | Client can cancel; craftsman cannot |
| **in_progress** | N/A | Must be manually completed |
| **completed** | Review period: 7 days | After: rating becomes permanent |

---

## Cancellation Rules

| Actor | When Can Cancel | Conditions |
|-------|----------------|------------|
| **Client** | Before pickup | Full refund |
| **Client** | After pickup | Partial refund only if craftsman cancels |
| **Craftsman** | Before pickup | Rare, only if client's address is unreachable |

---

## ETA Calculation

```
ETM = (Distance between craftsman current location + client location) / (speed limit + traffic factor)

Formula:
  ETA_mins = (straight_line_distance_km / avg_speed_kmh) * 60
  + traffic_buffer (15-30 mins)
  + walking_buffer (if walking)

Example:
  Distance: 5 km
  Avg speed: 30 km/h (city traffic)
  Traffic buffer: 20 mins
  ETA = (5 / 30) * 60 + 20 = 10 + 20 = 30 mins
```

---

## UI for Client (Company Location Tracking)

```tsx
// features/orders/components/map-tracking.tsx
'use client';

import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { useCraftsmanLocation } from '@/features/locations/hooks/use-craftsman-location';

export function ActiveOrderMap({ craftsmanId }: { craftsmanId: string }) {
  const { data: location, isLoading } = useCraftsmanLocation(craftsmanId);
  const [clientLat, clientLng] = useClientLocation();

  if (isLoading) return <Spinner />;

  return (
    <MapContainer center={[clientLat, clientLng]} zoom={14}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Polyline positions={[[clientLat, clientLng]]} color="blue" />
      {location && (
        <Marker position={[parseFloat(location.lat), parseFloat(location.lng)]}>
          <Popup>الحرفي يتحرك نحوك...</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
```

---

## Edge Cases

| Scenario | Resolution |
|----------|------------|
| **Craftsman goes offline during active order** | Mark as "possible issue"; notify client; keep order status |
| **Craftsman location fails to update for >5 mins** | Consider them offline; show 'unknown' to client |
| **Client location redacted** | Allow anonymous orders (pickup point) |
| **Craftsman has multiple concurrent orders** | Allow max 3 active orders per craftsman |
| **Client requests order type not in craftsman's skill** | Blocker: client should search by craft type first |

---

## Related Diagrams
- [Data Flow - Onboarding](data-flow-onboarding.md)
- [Data Flow - Complaints](data-flow-complaint.md)
- [Sequence - Google OAuth](seq-google-oauth.md)
- [Sequence - Realtime Location](seq-realtime-location.md)
- [ERD](erd.md)
