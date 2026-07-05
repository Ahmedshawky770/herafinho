# WebSocket Disconnection Handling

## Common Issues and Solutions

### Client disconnects frequently

**Cause**: Heartbeat timeout or network instability.

**Solution**:
```typescript
// Client-side reconnection logic
const ws = new WebSocket('wss://herafino.com/ws');
ws.onclose = () => {
  setTimeout(() => {
    connectWebSocket();
  }, Math.min(1000 * 2 ** retryCount, 30000)); // Exponential backoff
};
```

### "Invalid token" errors on connection

**Cause**: Session expired or malformed JWT.

**Solution**:
- Ensure JWT contains `userId` and `role` claims
- Check token expiration (24h default)
- Verify craftsman has `status: approved` in database

### Location not broadcasting

**Cause**: GPS blocked or position unavailable.

**Solution**:
```javascript
// Fallback to last known location
navigator.geolocation.watchPosition(
  successCallback,
  (error) => {
    if (error.code === error.PERMISSION_DENIED) {
      // Use cached location
      sendCachedLocation();
    }
  },
  { enableHighAccuracy: true, timeout: 10000 }
);
```

## Server-Side Monitoring

Monitor active connections via Valkey:
```bash
valkey-cli PUBSUB CHANNELS | grep "location:"
```