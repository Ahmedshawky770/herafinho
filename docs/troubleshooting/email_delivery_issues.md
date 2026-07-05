# Email Delivery Issues

## Common Issues and Solutions

### Resend API returns 429 (rate limit)

**Cause**: Exceeded Resend rate limits (100 emails/minute for free tier).

**Solution**:
```typescript
// Implement queue with BullMQ for email dispatch
import { Queue } from 'bullmq';

const emailQueue = new Queue('emails', {
  connection: valkeyClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

// Use queue instead of direct send
await emailQueue.add('send', { template, to, data });
```

### Emails going to spam

**Cause**: Missing SPF/DKIM records or suspicious content.

**Solution**:
1. Configure DNS records:
   - SPF: `v=spf1 include=spf.resend.com ~all`
   - DKIM: Add Resend-provided DKIM records
   - DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@herafino.com`

2. Use verified sender domain in Resend dashboard

### "Invalid API key" error

**Cause**: Missing or incorrect RESEND_API_KEY.

**Solution**:
```bash
# Check environment
echo $RESEND_API_KEY

# Test with curl
curl -X POST https://api.resend.com/v1/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@herafino.com","to":["test@example.com"],"subject":"Test","html":"<p>Test</p>"}'
```

### SMTP fallback not configured

**Cause**: Resend service down in production.

**Solution**:
```typescript
// Use dual provider strategy
const emailService = new DualEmailService([
  new ResendService(),
  new SMTPService(process.env.SMTP_URL),
]);
```