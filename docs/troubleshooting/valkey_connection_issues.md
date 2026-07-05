# Valkey Connection Issues

## Common Issues and Solutions

### Connection timeout

**Cause**: Valkey container not running.

**Solution**:
```bash
# Start infrastructure
npm run docker:dev

# Verify Valkey is accessible
valkey-cli -p 6379 ping
# Should return: PONG
```

### "Connection refused" errors

**Cause**: Wrong connection string or port mismatch.

**Solution**:
```bash
# Check .env.local configuration
VALKEY_URL=valkey://localhost:6379

# Verify service is listening
netstat -tlnp | grep 6379
```

### Cache miss streaks

**Cause**: TTL exceeded or manual flush.

**Solution**:
```typescript
// Check cache hit rate
const hitRate = await valkey.eval(`
  local hits = redis.call('GET', 'stats:hits') or 0
  local misses = redis.call('GET', 'stats:misses') or 0
  return hits / (hits + misses)
`);

// Monitor keys
valkey-cli --scan --pattern "craftsman:*"
```