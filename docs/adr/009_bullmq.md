# ADR: BullMQ for Background Job Processing

**Status**: adopted  
**Date**: 2024-01-21

## Context

We need reliable background job processing for:
- Welcome/notification emails
- Complaint processing and escalation
- Webhook delivery with retries
- Scheduled data cleanup
- Report generation

## Decision

We will use **BullMQ** for background job processing with Valkey as the backend.

## Consequences

- Built-in retries, backoff, and rate limiting
- Job events for monitoring
- Repeatable jobs for scheduled tasks
- Requires separate worker process
- Valkey persistence ensures job durability

## Alternatives Considered

1. **Bull**: Predecessor, less active maintenance
2. **Agenda**: MongoDB-based, requires separate store
3. **Resque**: Ruby ecosystem, less suited for Node.js

## References

- [BullMQ Documentation](https://docs.bullmq.io)
