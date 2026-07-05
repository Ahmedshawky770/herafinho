# ADR-002: Choosing a Modular Monolith over Microservices

| Status | Accepted |
|--------|----------|
| Date | 2026-07-01 |
| Author | Ahmed Shawky |
| Reviewers | — |

---

## Context

Harfino is an MVP marketplace platform with 4 user roles, ~10 core domain concepts (users, craftsmen, orders, reviews, complaints, locations, notifications, admin actions, webhooks, audit logs), and a team of 1–3 engineers.

We need an architecture that:
- Enables fast iteration in early phases.
- Maintains clear boundaries between business domains.
- Avoids operational complexity of distributed systems.
- Can be split into microservices later if the product grows.

We considered three options:
1. **Monolithic Next.js app** (no internal module boundaries)
2. **Modular Monolith** (internal modules with contracts, deployed as one unit)
3. **Microservices** (separate deployable services per domain)

---

## Decision

We chose **Option B: Modular Monolith**.

### Rationale

| Criterion | Modular Monolith | Microservices | Plain Monolith |
|-----------|-----------------|---------------|----------------|
| **Time to MVP** | Fast (single deploy) | Slow (orchestration, deploys) | Fastest but risky |
| **Team size fit** | 1–3 engineers | 5+ engineers | 1 engineer |
| **Operational overhead** | Low (single DB, single process) | High (service mesh, monitoring per service) | Lowest |
| **Module boundaries** | Enforced via contracts + events | Natural (network boundary) | None / optional |
| **Future extractability** | High (modules → services later) | Already extracted | Hard (spaghetti code) |
| **Database transactions** | ACID across modules | Distributed transactions (Saga) | ACID |
| **Testing complexity** | Medium (module integration tests) | High (contract + integration tests) | Low (but coverage drifts) |

### Why not plain monolith?
A plain monolith without enforced boundaries accumulates **tight coupling** over time. After 6 months, replacing a module becomes a months-long refactoring project. The Modular Monolith forces **loose coupling via Contracts** (see Principle 7) and **Domain Events** from day one.

### Why not microservices now?
Microservices add operational complexity (service discovery, distributed tracing, circuit breakers, saga patterns, per-service databases) that is unjustified for an MVP with a small team. We can extract services later when module boundaries are already defined.

---

## Consequences

### Good
- **Single deployment unit** simplifies CI/CD and rollback.
- **ACID transactions** across modules via single PostgreSQL connection.
- **Clear module contracts** enable future microservice extraction.
- **Simpler debugging** (no distributed tracing required yet).
- **Lower infrastructure cost** (one app container + one worker container).

### Bad
- **Scaling is vertical** (scale the whole app). Mitigation: horizontal scale Next.js instances behind load balancer; Valkey as shared cache.
- **Module coupling risk** if contracts are not enforced. Mitigation: lint rules + code review gates + contract tests.
- **Database schema** must accommodate all modules. Mitigation: careful upfront ERD design (see `docs/diagrams/erd.md`).

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Module boundaries erode over time | Medium | High | Code review + contract tests + ADRs for cross-module changes |
| Database becomes bottleneck at scale | Low (initially) | Medium | Connection pooling (PgBouncer); vertical scale first; consider read replicas |

---

## Alternatives Considered

### Plain Monolith (no module boundaries)
- **Why rejected**: No enforced contracts between features. After 6 months, auth logic leaks into craftsman module, order module imports user internals, etc. Technical debt accumulates silently.

### Microservices from Day 1
- **Why rejected**: Overhead of Docker Compose / Kubernetes per service; distributed tracing; per-service databases; saga patterns for order + complaint flows. Not justified for an MVP with 1–3 engineers.

### Modular Monolith with Hexagonal Architecture (Ports & Adapters)
- **Why not chosen**: Adds extra abstraction layers (Port, Adapter, Use Case Interactor) that increase file count without proportional value for an MVP. Our Use Cases + Contracts pattern is a pragmatic subset of Hexagonal.

---

## References
- [ADR-001: Using Valkey over Redis](001_why_valkey_over_redis.md)
- [ADR-003: Choosing Drizzle ORM](003_why_drizzle_orm.md)
- [Modular Monolith pattern](https://www.kamilgrzybek.com/design-patterns/modular-monolith-primer/)
- [Simon Brown — The Modular Monolith](https://www.youtube.com/watch?v=5OjqD-ow8GE)

---

## Related Documents
- [Project Plan](../plan.md)
- [C4 Level 3 Component Diagram](../diagrams/c4-l3-component-internal.md)
- [Module Boundaries](plan.md#7-module-boundaries)
