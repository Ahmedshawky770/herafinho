# ADR: React Query for Client Data Fetching

**Status**: adopted  
**Date**: 2024-01-22

## Context

The dashboard and craftsman profiles require frequent data fetching with automatic
background refetching, caching, and optimistic updates.

## Decision

We will use **TanStack Query (React Query v5)** for client-side data management.

## Consequences

- Automatic caching and background refetching
- Dedicated devtools for debugging
- Eliminates need for manual loading/error states in many cases
- Requires careful invalidation strategy alongside Valkey cache

## Alternatives Considered

1. **SWR**: Similar but smaller ecosystem
2. **Apollo Client**: Overkill for REST-heavy APIs
3. **Zustand + manual fetch**: More boilerplate, error-prone

## References

- [TanStack Query](https://tanstack.com/query)
