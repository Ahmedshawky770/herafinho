# ADR: WebSocket vs Server-Sent Events for Real-Time Location

**Status**: adopted  
**Date**: 2024-01-20

## Context

We need to broadcast real-time craftsman location updates to clients viewing the map. Options:

- **WebSocket**: Full-duplex persistent connection
- **Server-Sent Events (SSE)**: Server-to-client unidirectional stream
- **Polling**: Regular HTTP requests (not suitable for real-time)

## Decision

We will use **WebSocket** for real-time location updates.

## Consequences

- Full-duplex communication if we need client-to-server messages later
- Better suited for high-frequency location updates
- ws library is lightweight and well-supported
- Requires separate server (port 3001) or path-based routing

## Alternatives Considered

1. **SSE**: Simpler but only unidirectional
2. **Ably/Pusher**: Managed service but external dependency
3. **GraphQL Subscriptions**: Requires Apollo/ Relay infrastructure

## References

- [WebSocket Protocol RFC 6455](https://datatracker.ietf.org/doc/html/rfc6455)
