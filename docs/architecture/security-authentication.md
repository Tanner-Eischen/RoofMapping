# Security & Authentication

## MVP Security (No Auth)

For MVP, no user authentication required:
- Public API endpoints
- Rate limiting via Vercel edge config
- Input validation with Zod schemas
- CORS configured for same-origin only

## Future Authentication

Prepare structure for auth in future versions:

```typescript
// lib/auth/middleware.ts (future)
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './jwt'

export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const payload = await verifyToken(token)
    // Attach user to request context
    return payload
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
```

## Data Security

1. **API Keys:** Environment variables only, never in code
2. **Database:** Connection via SSL, credentials rotated
3. **S3:** Pre-signed URLs with expiration (1 hour)
4. **Secrets:** AWS Secrets Manager for production
5. **Input Validation:** Zod schemas on all API routes

---
