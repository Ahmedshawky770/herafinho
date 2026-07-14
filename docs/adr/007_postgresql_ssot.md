# ADR: PostgreSQL as Single Source of Truth (SSOT)

**Status**: adopted  
**Date**: 2024-01-18

## Context

All domain data (users, craftsmen, orders, reviews, complaints) must be persisted
consistently across web, worker, and potentially mobile services.

## Decision

We will use **PostgreSQL 16** as the single source of truth for all application data.

## Consequences

- Strong consistency guarantees via ACID transactions
- Rich query capabilities for complex reporting
- Drizzle ORM for type-safe schema definitions and migrations
- Valkey used only as cache; PostgreSQL remains authoritative

## Alternatives Considered

1. **MongoDB**: Flexible schema but weaker consistency guarantees
2. **MySQL**: Mature but PostgreSQL has better JSON support and extensions
3. **CockroachDB**: Distributed but operational complexity

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
