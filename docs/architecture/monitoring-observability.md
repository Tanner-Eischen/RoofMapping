# Monitoring & Observability

## Logging Strategy

**1. Frontend Logging**

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log('[INFO]', message, meta)
    // Send to analytics (future)
  },
  
  error: (message: string, error?: Error, meta?: any) => {
    console.error('[ERROR]', message, error, meta)
    // Send to Sentry/error tracking (future)
  },
  
  performance: (metric: string, value: number) => {
    console.log('[PERF]', metric, value)
    // Send to analytics
  }
}
```

**2. Backend Logging**

All API routes log:
- Request ID
- User action
- Response time
- Status code
- Error details (if any)

**3. ML Pipeline Logging**

Lambda logs to CloudWatch:
- Analysis ID
- Processing steps
- ML model metrics
- External API calls
- Error stack traces

## Metrics to Track

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| API Response Time | Vercel Analytics | >500ms (p95) |
| ML Processing Time | CloudWatch | >10 min |
| Error Rate | CloudWatch | >5% |
| Database Connections | Prisma Metrics | >80% pool |
| Lambda Concurrency | CloudWatch | >800 |
| Cache Hit Rate | Redis INFO | <70% |

## Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    queue: await checkQueue()
  }
  
  const healthy = Object.values(checks).every(c => c.healthy)
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  }, { status: healthy ? 200 : 503 })
}
```

---
