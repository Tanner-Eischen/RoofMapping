# Error Handling & Resilience

## Error Handling Strategy

**1. Frontend Error Boundaries**

```typescript
// components/error-boundary.tsx
'use client'

import { useEffect } from 'react'

export function ErrorBoundary({
  error,
  reset
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error:', error)
  }, [error])
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button onClick={reset} className="mt-4">Try again</button>
    </div>
  )
}
```

**2. API Error Responses**

```typescript
// Standard error response format
interface ErrorResponse {
  error: string
  code?: string
  details?: any
}

// Example usage
return NextResponse.json({
  error: 'Analysis failed',
  code: 'ML_PROCESSING_ERROR',
  details: { reason: 'No satellite imagery available' }
}, { status: 500 })
```

**3. ML Pipeline Retries**

- SQS dead letter queue after 3 retries
- Exponential backoff: 30s, 2m, 5m
- Update database status to FAILED after max retries

## Fallback Mechanisms

1. **Satellite Data Unavailable:** Trigger mobile assist immediately
2. **LiDAR Unavailable:** Calculate pitch from satellite imagery only
3. **Low Confidence (<70%):** Request mobile photos
4. **API Timeout:** Show retry button with helpful message

## Circuit Breaker Pattern

```typescript
// lib/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private readonly threshold = 5
  private readonly timeout = 60000 // 1 minute
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open')
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private isOpen(): boolean {
    if (this.failures < this.threshold) return false
    return Date.now() - this.lastFailureTime < this.timeout
  }
  
  private onSuccess() {
    this.failures = 0
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
  }
}
```

---
