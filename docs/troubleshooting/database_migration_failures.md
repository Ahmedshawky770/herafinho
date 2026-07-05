# Database Migration Failures

## Common Issues and Solutions

### Migration fails with "column does not exist"

**Cause**: Running migrations out of order or on corrupted schema.

**Solution**:
```bash
# Check current migration state
npm run db:studio

# Reset and re-run migrations
docker compose down -v  # WARNING: Destroys data
npm run db:migrate
```

### Drizzle migration generates empty file

**Cause**: No schema changes detected.

**Solution**:
```bash
# Force regeneration
rm -f apps/web/src/lib/db/migrations/*.sql
npm run db:generate
```

### Foreign key constraint violations

**Cause**: Referenced records don't exist.

**Solution**:
```sql
-- Check for orphaned records
SELECT * FROM craftsman_profiles WHERE user_id NOT IN (SELECT id FROM users);
```

Ensure seeding order respects dependencies: users → craftsmen → orders.