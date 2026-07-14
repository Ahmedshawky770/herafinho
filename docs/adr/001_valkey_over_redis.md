# ADR: Adopting Valkey as Primary Cache and Queue Backend

**Status**: adopted  
**Date**: 2024-01-15

## Context

The Harfino platform requires:
1. **Caching layer** for frequently accessed craftsmen profiles, order statuses, and search results
2. **Queue backend** for BullMQ workers (emails, notifications, webhooks)
3. **Pub/Sub** for real-time location updates
4. **Distributed locking** for idempotent order operations

We evaluated two options:
- **Redis**: The industry standard for caching and queues
- **Valkey**: Redis-compatible open-source fork under Linux Foundation

## Decision

We will use **Valkey** as the primary cache and queue backend.

## Consequences

- Valkey is API-compatible with Redis, minimizing migration effort
- Open-source governance reduces vendor lock-in risk
- Compatible with existing Redis clients (iovalkey, bullmq)
- Supports all required features: strings, hashes, pub/sub, streams, sorted sets

## Alternatives Considered

1. **Redis Stack**: More features but stricter licensing
2. **Memcached**: Limited feature set, no pub/sub
3. **Amazon ElastiCache**: Cloud-managed but vendor-locked

## References

- [Valkey Official Documentation](https://valkey.io)
- [BullMQ Documentation](https://docs.bullmq.io)
