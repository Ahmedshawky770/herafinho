# Webhook Architecture - Outgoing & Incoming

```mermaid
flowchart TD
    subgraph "Harfino Events (Triggers)"
        CraftsmanApproved[craftsman.approved]
        CraftsmanRejected[craftsman.rejected]
        CraftsmanBanned[craftsman.banned]
        OrderCreated[order.created]
        OrderCompleted[order.completed]
        ReviewCreated[review.created]
        ComplaintFiled[complaint.filed]
        ComplaintResolved[complaint.resolved]
        LocationChanged[craftsman.location_changed]
    end

    subgraph "Event Bus"
        EventBus[Domain Event Bus<br/>Internal Pub/Sub]
        Outbox[Outbox Pattern<br/>PostgreSQL Table]
    end

    subgraph "Webhook Module"
        Dispatcher[Webhook Dispatcher<br/>HTTP POST with HMAC]
        RetryQueue[Retry Queue<br/>BullMQ + Valkey]
        DeadLetterQueue[Dead Letter Queue<br/>After 3 Retries]
        CircuitBreaker[Circuit Breaker<br/>Trip after 5 failures]
    end

    subgraph "External Webhooks (Subscriptions)"
        CRM[CRM Integration]
        Analytics[Analytics Dashboard]
        NotificationThirdParty[Third-party SMS/Push]
        AdminDashboard[External Admin Panel]
        BackupService[Data Backup Service]
    end

    subgraph "Incoming Webhooks"
        PaymentGateway[Payment Gateway<br/>(Future: Paymob)]
        SMSProvider[SMS Provider<br/>(for 2FA fallback)]
        ThirdPartyNotifs[Third-party Notifications]
    end

    subgraph "Database"
        webhooks[webhooks table]
        webhook_logs[webhook_delivery_logs table]
    end

    CraftsmanApproved --> EventBus
    CraftsmanRejected --> EventBus
    CraftsmanBanned --> EventBus
    OrderCreated --> EventBus
    OrderCompleted --> EventBus
    ReviewCreated --> EventBus
    ComplaintFiled --> EventBus
    ComplaintResolved --> EventBus
    LocationChanged --> EventBus

    EventBus --> Outbox
    Outbox --> Dispatcher

    Dispatcher --> webhooks
    webhooks --> RetryQueue
    RetryQueue --> CircuitBreaker
    CircuitBreaker -->|Success| ExternalWebhooks
    CircuitBreaker -->|Failure| RetryQueue
    RetryQueue -->|3x Failure| DeadLetterQueue

    Dispatcher --> CRM
    Dispatcher --> Analytics
    Dispatcher --> NotificationThirdParty
    Dispatcher --> AdminDashboard
    Dispatcher --> BackupService

    IncomingWebhooks --> WebhookModule
    PaymentGateway --> WebhookModule
    SMSProvider --> WebhookModule
    ThirdPartyNotifs --> WebhookModule
```

---

## Webhook Database Schema

```typescript
// features/webhooks/schema.ts
export const webhooks = pgTable('webhooks', {
  id: text('id').primaryKey(), // UUID
  event: text('event').notNull(), // e.g., 'craftsman.approved'
  url: text('url').notNull(), // Target URL
  secret: text('secret').notNull(), // HMAC secret
  isActive: boolean('is_active').default(true),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const webhookDeliveryLogs = pgTable('webhook_delivery_logs', {
  id: text('id').primaryKey(), // UUID
  webhookId: text('webhook_id').references(() => webhooks.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  error: text('error'),
  attempts: integer('attempts').default(1),
  deliveredAt: timestamp('delivered_at'),
  nextAttemptAt: timestamp('next_attempt_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Webhook Event Catalog

### Outgoing Webhooks

| Event | Trigger | Payload Example | Target |
|-------|---------|----------------|--------|
| **`craftsman.approved`** | Admin approves craftsman | `{ userId, profileId, craftType, approvedAt }` | Admin Dashboard, Analytics |
| **`craftsman.rejected`** | Admin rejects craftsman | `{ userId, reason, rejectedAt }` | Analytics |
| **`craftsman.banned`** | Admin/M-Auto bans craftsman | `{ userId, reason, action, bannedAt }` | Audit, CRM |
| **`order.created`** | Client creates order | `{ orderId, clientId, craftsmanId, craftType, status }` | Push Notification Service |
| **`order.accepted`** | Craftsman accepts order | `{ orderId, craftsmanId, status }` | Client Notification |
| **`order.completed`** | Order marked complete | `{ orderId, rating }, requestReview: true` | Analytics, Reports |
| **`review.created`** | Client submits review | `{ reviewId, orderId, contractorId, rating }` | Analytics, Reputation |
| **`complaint.filed`** | Client files complaint | `{ complaintId, againstUserId, reason }` | Admin Dashboard |
| **`complaint.resolved`** | Admin resolves complaint | `{ complaintId, againstUserId, actionTaken, resolvedAt }` | Email Notifications |

---

## Outgoing Webhook Dispatch

```typescript
// features/webhooks/services/webhook-dispatcher.service.ts
export class WebhookDispatcher {
  constructor(
    private readonly webhookRepository: IWebhookRepository,
    private readonly webhookLogRepository: IWebhookLogRepository,
    private readonly queue: BullMQQueue,
    private readonly secrets: SecretManager,
  ) {}

  async dispatch(event: string, payload: Record<string, unknown>): Promise<void> {
    const webhooks = await this.webhookRepository.findActiveByEvent(event);

    if (webhooks.length === 0) return;

    const adapterPromises = webhooks.map((webhook) => {
      return this.queue.add(
        `webhook:${webhook.id}`,
        { event, payload, webhookId: webhook.id },
        {
          attempts: webhook.maxRetries || 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
          delay: 0,
          // ...jobOptions
        }
      );
    });

    await Promise.allSettled(adapterPromises);
  }

  async sendWebhook(webhook: Webhook, event: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const secret = await this.secrets.getWebhookSecret(webhook.id);
      const signature = this.signPayload(secret, payload);
      const response = await this.sendWithTimeout(webhook.url, payload, signature);

      await this.webhookLogRepository.create({
        webhookId: webhook.id,
        event,
        payload,
        responseStatus: response.status,
        deliveredAt: new Date(),
      });

      await this.webhookRepository.updateLastTriggered(webhook.id, new Date());
    } catch (error) {
      await this.webhookLogRepository.create({
        webhookId: webhook.id,
        event,
        payload,
        error: error.message,
        attempts: (webhook.retryCount || 0) + 1,
        nextAttemptAt: this.calculateNextAttempt(webhook.retryCount || 0),
      });

      if (webhook.retryCount && webhook.retryCount >= (webhook.maxRetries || 3)) {
        await this.webhookRepository.deactivate(webhook.id);
        logger.warn({ webhookId: webhook.id }, 'Webhook deactivated after max retries');
      }
    }
  }

  private signPayload(secret: string, payload: Record<string, unknown>): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  private calculateNextAttempt(attempt: number): Date {
    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
    return new Date(Date.now() + delay);
  }
}
```

---

## Webhook Security

| Threat | Mitigation |
|--------|------------|
| **Replay Attack** | Timestamp in payload; reject if > 5 min old |
| **Tampering** | HMAC SHA-256 signature with secret |
| **Man-in-the-Middle** | HTTPS only; validate SSL certificate |
| **Information Disclosure** | No secrets in payload; only non-sensitive data |
| **Brute Force** | 3 retries max, exponential backoff, then deactivation |
| **Unauthorized Subscriptions** | Admin-only webhook creation |

```typescript
// features/webhooks/middleware/verify-webhook.ts
export function verifyWebhookSignature(req: Request, secret: string): boolean {
  const signature = req.headers.get('X-Harfino-Signature');
  const timestamp = req.headers.get('X-Harfino-Timestamp');
  const body = await req.text();

  if (!signature || !timestamp) return false;

  const age = (Date.now() - parseInt(timestamp)) / 1000;
  if (age > 300) return false; // Reject if older than 5 minutes

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}
```

---

## Incoming Webhooks (Future)

```mermaid
flowchart TD
    subgraph "External Services"
        PaymentGateway[Payment Gateway<br/>(Paymob)]
        SMS[SMS Provider]
        Push[Push Notification Service]
    end

    Incoming[Incoming Webhook Endpoint<br/>/api/webhooks/:source]
    Validation[Validate HMAC Signature]
    Handler[Event Handler<br/>Based on source type]
    DB[(PostgreSQL)]
    Notify[Notify internal modules]
    Dispatcher[WebhookDispatcher<br/>Outgoing]

    PaymentGateway -->|POST| Incoming
    SMS -->|POST| Incoming
    Push -->|POST| Incoming

    Incoming --> Validation
    Validation -->|valid| Handler
    Validation -->|invalid| Reject[401 Unauthorized]

    Handler --> DB
    Handler --> Notify
    Notify --> Dispatcher
```

---

## Webhook Testing

```typescript
// tests/webhooks/webhook-dispatcher.test.ts
describe('WebhookDispatcher', () => {
  it('should dispatch event to all subscribers', async () => {
    const mockWebhooks = [
      { id: '1', event: 'order.created', url: 'https://example.com', active: true },
      { id: '2', event: 'order.created', url: 'https://example2.com', active: true },
    ];

    mockedWebhookRepo.findActiveByEvent.mockResolvedValue(mockWebhooks);
    mockedQueue.add.mockResolvedValue({ id: 'job-id' });

    await dispatcher.dispatch('order.created', { orderId: '123' });

    expect(mockedQueue.add).toHaveBeenCalledTimes(2);
    expect(mockedQueue.add).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: 'order.created' }),
      expect.any(Object)
    );
  });
});
```

---

## Monitoring & Alerts

| Metric | Alert Threshold |
|--------|-----------------|
| **Webhook Failure Rate** | > 20% in 1 hour |
| **Avg Delivery Time** | > 5 seconds |
| **Dead Letter Queue Size** | > 50 |
| **Webhook Response Time (P95)** | > 2 seconds |
| **Webhook URL Unreachable** | > 3 consecutive failures → deactivate |

---

## Webhook Management (Admin API)

```typescript
// API Routes for Admin Webhook Management
// GET /api/admin/webhooks - List all webhooks
// POST /api/admin/webhooks - Create webhook subscription
// PATCH /api/admin/webhooks/:id - Update (active/inactive)
// DELETE /api/admin/webhooks/:id - Remove subscription
// GET /api/admin/webhooks/:id/logs - View delivery logs
```

---

## Related Documents
- [Data Flow - Complaint](data-flow-complaint.md)
- [Sequence - Google OAuth](seq-google-oauth.md)
- [C4 L2 - Container](c4-l2-container-deployment.md)
- [Plan](plan.md)
- [ADR-XXX: Webhook Strategy](adr/)
