# Monitoring & Observability Architecture - Harfino

```mermaid
flowchart TD
    subgraph "Data Collection"
        AppMetrics["Application Metrics<br/>Response Time, Error Rate"]
        DBQueries["Database Query Metrics<br/>pg_stat_statements"]
        ValkeyMetrics["Valkey Metrics<br/>Hit Rate, Memory"]
        WebSocketMetrics["WebSocket Metrics<br/>Connections, Latency"]
        BusinessMetrics["Business Metrics<br/>Orders/day, Complaints, Reviews"]
        Logs["Structured Logs<br/>Pino JSON"]
        Traces["Distributed Traces<br/>OpenTelemetry (optional)"]
    end

    subgraph "Observability Stack"
        Prometheus["Prometheus<br/>(Metrics)"]
        Grafana["Grafana<br/>(Dashboards)"]
        Loki["Grafana Loki<br/>(Logs Aggregation)"]
        Jaeger["Jaeger<br/>(Traces)"]
        Sentry["Sentry<br/>(Error Tracking)"]
        AlertManager["Grafana AlertManager<br/>(Alerts)"]
        SlackNotify["Slack Notifications"]
    end

    subgraph "Vercel Edge"
        VercelAnalytics["Vercel Analytics<br/>(Page views)"]
        VercelEdgeFunctions["Edge Logs"]
    end

    subgraph "Custom Dashboards"}]}]}]}]}]}]}]}]}]}]}]
        AdminDashboard["Admin Dashboard<br/>Real-time Stats"]
        BusinessHealth["Business Health<br/>Orders, Revenue"]
        InfrastructureHealth["Infrastructure<br/>CPU, Memory, Network"]
        PerformanceDash["Performance<br/>P95, P99 Latency"]
    end

    AppMetrics --> Prometheus
    DBQueries --> Prometheus
    ValkeyMetrics --> Prometheus
    WebSocketMetrics --> Prometheus
    BusinessMetrics --> Prometheus

    Logs --> Loki
    Traces --> Jaeger

    Prometheus --> Grafana
    Loki --> Grafana
    Jaeger --> Grafana

    Prometheus --> AlertManager
    Loki --> AlertManager

    AlertManager -->|Critical| SlackNotify
    AlertManager -->|Warning| SlackNotify

    Sentry -->|"Console errors<br/>API errors<br/>React errors"| Grafana
    Grafana --> AdminDashboard
    Grafana --> BusinessHealth
    Grafana --> InfrastructureHealth
    Grafana --> PerformanceDash

    VercelAnalytics -.->|"Page load times"| Grafana
    VercelEdgeFunctions -.->|"Edge functions"| Loki

    style Sentry fill:#ef4444,color:white
    style Prometheus fill:#f59e0b,color:black
    style Grafana fill:#f59e0b,color:black
    style Loki fill:#3b82f6,color:white
    style SlackNotify fill:#10b981,color:white
    style AlertManager fill:#ef4444,color:white

    linkStyle 5 stroke:#ef4444,stroke-width:2px
    linkStyle 6 stroke:#f59e0b,stroke-width:2px
    linkStyle 12 stroke:#10b981,stroke-width:2px
```

---

## Key Metrics

### Application Performance

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **API Response Time (p95)** | < 500ms | > 1000ms (1s) |
| **WebSocket Connection Latency** | < 200ms | > 500ms |
| **Page Load Time (LCP)** | < 2.5s | > 4s |
| **Error Rate (5xx)** | < 0.5% | > 5% for 5 minutes |
| **Next.js Build Time** | < 120s | > 300s |

### Database Performance

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Query Response Time (p95)** | < 100ms | > 500ms |
| **Active Connections** | < 80% max | > 90% max |
| **Cache Hit Rate** | > 80% | < 60% |
| **Slow Queries** | 0 | > 50/min |
| **Deadlocks** | 0 | > 5/min |

### Valkey Cache Performance

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Hit Rate** | > 80% | < 60% |
| **Memory Usage** | < 80% | > 90% |
| **Eviction Rate** | 0 (per/second) | > 10/s |
| **Connected Clients** | < 100 | > 500 |

### Business Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Daily Active Users (DAU)** | > 500 | < 100 |
| **Daily Orders** | Stable growth | -50% day-over-day |
| **Complaint Rate** | < 2% of orders | > 5% of orders |
| **Craftsman Approval Rate** | > 50% | < 20% |
| **Average Review Rating** | 4.0+ | < 3.0 |

---

## Pino Structured Logs

```typescript
// libs/logger/factory.ts
import pino from 'pino';
import { randomUUID } from 'crypto';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatter: (log) => ({
    ...log,
    timestamp: new Date().toISOString(),
    service: 'herafino',
    env: process.env.NODE_ENV,
    requestId: randomUUID(),
  }),
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  redact: ['password', 'token', 'secret', 'authorization'], // Pino redact
});

// Usage Example
logger.info({
  userId: user.id,
  action: 'craftsman_approved',
  craftType: craftsman.craftType,
  roundTrip: '48h',
}, 'Craftsman approved by admin');
```

### Winston vs. Pino

```typescript
// Winston (alternative - not recommended, Pino is faster)
// import winston from 'winston';
// export const logger = winston.createLogger({
//   format: winston.format.json(),
//   transporters: [new winston.transports.Console()]
// });

// Pino (Preferable - JSON, faster)
// Features:
// - Structured logging (JSON)
// - Log levels: debug, info, warn, error
// - Trace ID and Request ID support
// - Child loggers for module-specific context
// - Pino-pretty for dev
// - Pino-http for request logging
```

---

## Prometheus Metrics

```typescript
// libs/metrics/metrics.ts
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

const register = new Registry();

// HTTP Request Metrics
export const httpRequestDuration = new Histogram({
  name: 'herafino_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestCounter = new Counter({
  name: 'herafino_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Valkey Cache Metrics
export const valkeyHitRatio = new Gauge({
  name: 'herafino_valkey_hit_ratio',
  help: 'Valkey cache hit ratio (percentage)',
  labelNames: ['type'],
  registers: [register],
});

export const valkeyOperationDuration = new Histogram({
  name: 'herafino_valkey_operation_duration_seconds',
  help: 'Valkey operation duration',
  labelNames: ['operation', 'key_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

// WebSocket Metrics
export const wsConnectionCounter = new Gauge({
  name: 'herafino_ws_connected_clients',
  help: 'Number of connected WebSocket clients',
  labelNames: ['user_type'],
  registers: [register],
});

export const wsMessageCounter = new Counter({
  name: 'herafino_ws_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'direction'],
  registers: [register],
});

// Business Metrics
export const orderCounter = new Counter({
  name: 'herafino_orders_total',
  help: 'Total number of orders',
  labelNames: ['status', 'craft_type'],
  registers: [register],
});

export const reviewCounter = new Counter({
  name: 'herafino_reviews_total',
  help: 'Total number of reviews',
  labelNames: ['rating'],
  registers: [register],
});

// Health Check Endpoint
export function getMetrics() {
  return register.metrics();
}
```

---

## Grafana Dashboard Examples

### Dashboard 1: API Performance

```
herafino-http-requests-duration-seconds [p95, p99]
herafino-http-requests-total [sum by (method, route, status_code)]
herafino_http_request_duration_seconds_bucket [rate by (method, route)]
```

### Dashboard 2: Valkey Cache

```
herafino_valkey_hit_ratio (avg over 5m)
herafino_valkey_eviction_rate (sum)
herafino_valkey_connected_clients (max)
```

### Dashboard 3: Database

```
herafino_db_queries_duration (avg)
pg_stat_statements total_time (max)
pg_database_size (current)
```

### Dashboard 4: Business Health

```
herafino_orders_total (rate)
herafino_reviews_total (count by rating)
User activity (DAU, MAU)
```

---

## Grafana Alerts

```yaml
# alerts.yaml
groups:
  - name: herafino_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: sum(rate(herafino_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(herafino_http_requests_total[5m])) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: ValkeyCacheMiss
        expr: herafino_valkey_hit_ratio < 60
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Valkey hit ratio below 60%"
```

---

## Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'herafino'
    static_configs:
      - targets: ['localhost:3000/metrics']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'valkey'
    static_configs:
      - targets: ['localhost:9121']
```

---

## Sentry Alert Rules

| Rule | Condition | Channel |
|------|-----------|---------|
| **Critical Error Spike** | 50+ errors/min in 5m | Slack #alerts + PagerDuty |
| **Database Down** | No pings from Postgres exporter | Slack #ops |
| **WebSocket Disconnect** | Mass WS disconnects | Slack #alerts |
| **High Memory** | Node.js heap > 512MB | Slack #devops |
| **User Report Spike** | 5+ new user reports in 24h | Slack #support |

---

## OpenTelemetry (Optional)

```typescript
// libs/tracing/client.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'herafino',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT })
    : undefined,
  instrumentations: [getNodeAutoInstrumentations()],
});
```

---

## Visual Dashboards Summary

### Dashboard 1: API Performance
```
- HTTP Request Duration (p50, p95, p99)
- Error Rate (2xx, 3xx, 4xx, 5xx)
- Requests per second by route and method
- Active WebSocket connections
- Valkey Cache hit ratio
```

### Dashboard 2: Business Health
```
- Daily active users (DAU)
- Daily orders by status
- Craftsman approval rate
- Complaint rate by category
- Average review rating trend
- Revenue (future)
```

### Dashboard 3: Infrastructure
```
- CPU / Memory / Disk usage per container
- PostgreSQL connections
- Valkey memory usage and evictions
- Network I/O
- Docker container restarts
```

---

## Alert Channels

| Severity | Channel | Notification |
|----------|---------|--------------|
| **Critical** | Slack #alerts + PagerDuty | 24/7 on-call engineer |
| **Warning** | Slack #ops | Business hours only |
| **Info** | Grafana Dashboard | No notification |

---

## Related Documents
- [C4 L2 - Container](c4-l2-container-deployment.md)
- [Security Architecture](security-architecture.md)
- [Plan](plan.md)
- [ADR-012: Observability Strategy](adr/)
