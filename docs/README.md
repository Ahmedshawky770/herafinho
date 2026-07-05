# Harfino Documentation

Technical documentation for the Harfino craftsman marketplace platform.

## Quick Links

| Document | Description |
|----------|-------------|
| [Project Plan](plan.md) | Complete technical specification, architecture, and roadmap |
| [Project Structure](project-structure.md) | Codebase organization and directory layout |
| [Architecture Decisions](adr/) | ADRs documenting technology choices and rationale |
| [Troubleshooting](troubleshooting/) | Solutions for common development and production issues |

## Architecture

### C4 Model
- [System Context (L1)](diagrams/c4-l1-system-context.md) - High-level actors and system boundaries
- [Container (L2)](diagrams/c4-l2-container-deployment.md) - Deployment units and databases
- [Component (L3)](diagrams/c4-l3-component-internal.md) - Module boundaries and interactions

### Data Flow
- [Onboarding Flow](diagrams/data-flow-onboarding.md) - Craftsman registration and approval
- [Order Lifecycle](diagrams/data-flow-order.md) - Order creation to completion
- [Complaint Flow](diagrams/data-flow-complaint.md) - Complaint filing and moderation

### Database
- [Entity Relationship Diagram](diagrams/erd.md) - PostgreSQL schema and indexes

### Sequences
- [Google OAuth Login](diagrams/seq-google-oauth.md) - Authentication flow
- [Realtime Location](diagrams/seq-realtime-location.md) - WebSocket location broadcast

## Development

### Getting Started
1. Read [Project Plan](plan.md) for context
2. Review [Module Boundaries](plan.md#7-module-boundaries)
3. Check [Testing Strategy](diagrams/testing-pyramid.md)

### Key Principles
- No `any` / `as any` in TypeScript
- Structured logging (Pino) - no `console.log` in production
- All IDs are strings (UUIDs)
- Modular Monolith with Contracts for loose coupling
- PostgreSQL is Single Source of Truth
- Valkey for ephemeral cache only

## API Contracts

- [OpenAPI Specification](api-contracts/openapi.yaml)
- Type definitions in [packages/types/](../packages/types/src)

## Support

For issues, check [Troubleshooting](troubleshooting/) or create a GitHub issue.