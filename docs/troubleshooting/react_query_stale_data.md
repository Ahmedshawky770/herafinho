# React Query Stale Data Issues

## Common Issues and Solutions

### Data shows outdated values after update

**Cause**: Cache not invalidated after mutation.

**Solution**:
```typescript
// Invalidate relevant queries after mutation
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: updateOrder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  },
});
```

### Infinite refetch loop

**Cause**: Stale time too short or query key unstable.

**Solution**:
```typescript
// Set appropriate stale times
const { data } = useQuery({
  queryKey: ['craftsman', id],
  queryFn: () => fetchCraftsman(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Ensure query key stability (avoid inline objects)
// BAD: queryKey: ['user', { id, filters }]
// GOOD: queryKey: ['user', id, ...Object.values(filters)]
```

### WebSocket updates not syncing with cache

**Cause**: Manual cache update missing after WebSocket message.

**Solution**:
```typescript
// Update cache on WebSocket message
websocketService.on('location:update', (data) => {
  queryClient.setQueryData(['location', data.userId], data);
});
```

### Prefetch not working

**Cause**: Route changes before prefetch completes.

**Solution**:
```typescript
// Disable prefetch on hover if navigation is immediate
// Keep it for secondary data only
await queryClient.prefetchQuery({
  queryKey: ['nearby-craftsmen'],
  queryFn: fetchNearbyCraftsmen,
});
```