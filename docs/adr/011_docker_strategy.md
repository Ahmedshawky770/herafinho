# ADR: Docker Strategy for Development and Production

**Status**: adopted  
**Date**: 2024-01-25

## Context

We need consistent environments across development, staging, and production.

## Decision

We will use **Docker Compose** for both development and production orchestration.

## Consequences

- Single `docker-compose.yml` for local development
- `docker-compose.prod.yml` for production with health checks and secrets
- Multi-stage Dockerfiles for minimal production images
- PostgreSQL and Valkey run as containers locally
- Workers run as separate containers in production

## Alternatives Considered

1. **Kubernetes**: Overkill for current scale
2. **Docker Swarm**: Less community support than Compose
3. **Bare metal PM2**: Inconsistent environments

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
