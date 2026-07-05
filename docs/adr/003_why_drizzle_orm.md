# ADR-003: Choosing Drizzle ORM over Prisma

| Status | Accepted |
|--------|----------|
| Date | 2026-07-01 |
| Author | Ahmed Shawky |
| Reviewers | — |

---

## Context

Harfino needs a type-safe ORM for PostgreSQL with:
- Complex multi-tenant schemas (users, craftsmen, orders, complaints, locations).
- ENUM types, JSONB columns, PostGIS spatial queries.
- Minimal production bundle size.
- Migration tooling that does not surprise us (no data loss, no breaking changes).

We evaluated two mature TypeScript ORMs for PostgreSQL:
1. **Prisma** (popular, declarative schema)
2. **Drizzle ORM** (lightweight, SQL-like, explicit)

---

## Decision

We chose **Drizzle ORM**.

### Rationale

| Criterion | Drizzle ORM | Prisma | Notes |
|-----------|------------|--------|-------|
| **Bundle size** | ~7 kB | ~100 kB+ | Drizzle is tree-shakeable |
| **Query control** | Explicit `.select()`, `.where()` | Auto-generated queries | Drizzle SQL-like API is predictable |
| **Type safety** | `.inferSelect` / `.inferInsert` | `Prisma.User` auto-inferred | Both are excellent; Drizzle wins on explicitness |
| **ENUM support** | Native PostgreSQL ENUM | Prisma `@db.Enum` | Both work; Drizzle uses native PG ENUM directly |
| **JSONB** | `jsonb('column').$type<T>()` | `Json` | Drizzle typed JSONB is explicit |
| **Migrations** | `drizzle-kit generate:pg` (SQL output reviewed) | `prisma migrate dev` (introspective) | Drizzle outputs human-readable SQL files; Prisma hidden diffs |
| **Performance** | Near-native SQL (no query builder overhead) | Layer of abstraction | Drizzle typically 10–30% faster |
| **PostGIS** | Full support (raw SQL + relational) | Limited / raw SQL only | Harfino needs spatial queries |
| **Community** | Growing fast (2024–2025) | Mature, large | Drizzle sufficient for our use case |

### Why not Prisma?
- **Bundle size** is a concern for a Next.js fullstack app with client bundles.
- **Introspective migrations** are convenient during prototyping but risky in production: "auto-migrate" can cause unexpected schema changes. Drizzle requires explicit SQL review.
- **No `any` policy**: Drizzle's explicit API reduces temptation to cast to `any` for complex joins.

---

## Consequences

### Good
- **Explicit SQL-like API** — developers read `.select().where()` and know exactly what SQL is generated.
- **Zero runtime overhead** — type inference happens at compile time.
- **Migration transparency** — all diffs are human-readable SQL files in git.
- **PostGIS friendly** — spatial queries written explicitly.
- **No `any` by default** — types are inferrable but explicit.

### Bad
- **Smaller ecosystem** — fewer community tutorials than Prisma.
- **Migration tooling is newer** — `drizzle-kit` is stable but less battle-tested than Prisma Migrate.
- **Relational queries can be verbose** — e.g., `db.query.users.findMany({ with: { profile: true } })` vs Prisma's `include`.

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Drizzle team changes pricing / direction | Low | Low | MIT licensed; core is open source |
| Missing edge case in JSONB typing | Low | Medium | Fallback to `sql` template literal for complex queries |
| PostGIS queries require raw SQL | Medium | Low | Document patterns; wrap in repository methods |

---

## Alternatives Considered

### Prisma
- **Why rejected**: Larger bundle, introspection-based migrations are risky in production, larger attack surface for `any` escapes. Excellent for CRUD-heavy apps; Drizzle is a better fit for our explicit-control requirement.

### Raw SQL (pg library)
- **Why rejected**: Too low-level for a fast-moving MVP; type safety requires manual maintenance; SQL injection risk if developers forget parameterization. Drizzle gives us safety + explicitness.

### TypeORM
- **Why rejected**: Decorator-based API is verbose; declining community momentum; performance overhead.

---

## References
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzlekit](https://orm.drizzle.team/docs/drizzle-kit-overview)
- [ADR-001: Using Valkey over Redis](001_why_valkey_over_redis.md)

---

## Related Documents
- [Project Plan](../plan.md)
- [ERD Diagram](../diagrams/erd.md)
- [Database Schema](../packages/types/)
