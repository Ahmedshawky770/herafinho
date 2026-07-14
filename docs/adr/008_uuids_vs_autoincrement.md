# ADR: UUIDs vs Auto-Increment IDs

**Status**: adopted  
**Date**: 2024-01-19

## Context

We need to choose primary key strategies for database tables.

## Decision

We will use **UUIDs (UUIDv7)** as primary keys for all entities.

## Consequences

- Globally unique IDs prevent enumeration attacks
- Safe for merging data from multiple databases
- Better for distributed systems
- Slightly larger index size than integers
- UUIDv7 provides time-based sorting

## Alternatives Considered

1. **Auto-increment integers**: Smaller but predictable and enumerable
2. **ULIDs**: URL-safe but less standard library support
3. **Snowflake IDs**: Time-sortable but requires coordination

## References

- [UUIDv7 RFC](https://datatracker.ietf.org/doc/draft-ietf-uuidrev-rfc4122bis/)
