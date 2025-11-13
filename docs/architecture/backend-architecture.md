# Backend Architecture

## API Routes Architecture

**Next.js API Routes** following REST conventions:

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { analysisRepo } from '@/lib/db/repositories/analysis-repo'
import { queueClient } from '@/lib/queue/client'

const AnalyzeRequestSchema = z.object({
  address: z.string().min(5),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
})

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request
    const body = await request.json()
    const data = AnalyzeRequestSchema.parse(body)
    
    // 2. Create analysis record
    const analysis = await analysisRepo.create({
      address: data.address,
      latitude: data.lat,
      longitude: data.lng,
      status: 'queued'
    })
    
    // 3. Submit to ML processing queue
    await queueClient.sendMessage({
      analysisId: analysis.id,
      address: data.address,
      coordinates: { lat: data.lat, lng: data.lng }
    })
    
    // 4. Return analysis ID
    return NextResponse.json({
      analysisId: analysis.id,
      status: analysis.status
    }, { status: 202 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    
    console.error('Analysis submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

```typescript
// app/api/results/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { analysisRepo } from '@/lib/db/repositories/analysis-repo'
import { cacheClient } from '@/lib/cache/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // 1. Check cache first
    const cached = await cacheClient.get(`analysis:${id}`)
    if (cached) {
      return NextResponse.json(JSON.parse(cached))
    }
    
    // 2. Query database
    const analysis = await analysisRepo.findById(id)
    
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }
    
    // 3. Cache completed results
    if (analysis.status === 'completed') {
      await cacheClient.set(`analysis:${id}`, JSON.stringify(analysis), 3600)
    }
    
    return NextResponse.json(analysis)
    
  } catch (error) {
    console.error('Results fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Repository Pattern

```typescript
// lib/db/repositories/analysis-repo.ts
import { prisma } from '@/lib/db/client'
import { type Analysis, type CreateAnalysisInput, type UpdateAnalysisInput } from '@/types'

export const analysisRepo = {
  async create(input: CreateAnalysisInput): Promise<Analysis> {
    return prisma.analysis.create({
      data: {
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        status: 'queued',
        createdAt: new Date()
      }
    })
  },
  
  async findById(id: string): Promise<Analysis | null> {
    return prisma.analysis.findUnique({
      where: { id },
      include: {
        measurements: true,
        photos: true
      }
    })
  },
  
  async update(id: string, input: UpdateAnalysisInput): Promise<Analysis> {
    return prisma.analysis.update({
      where: { id },
      data: input
    })
  },
  
  async updateMeasurements(id: string, measurements: any): Promise<Analysis> {
    return prisma.analysis.update({
      where: { id },
      data: {
        measurements: {
          upsert: {
            create: measurements,
            update: measurements
          }
        },
        status: 'completed',
        completedAt: new Date()
      }
    })
  }
}
```

## Queue Service

```typescript
// lib/queue/client.ts
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

const QUEUE_URL = process.env.ML_QUEUE_URL!

export const queueClient = {
  async sendMessage(payload: any): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(payload)
    })
    
    await sqsClient.send(command)
  }
}
```

## Cache Service

```typescript
// lib/cache/client.ts
import { createClient } from 'redis'

const redis = createClient({
  url: process.env.REDIS_URL
})

redis.on('error', (err) => console.error('Redis error:', err))

export const cacheClient = {
  async connect() {
    if (!redis.isOpen) {
      await redis.connect()
    }
  },
  
  async get(key: string): Promise<string | null> {
    await this.connect()
    return redis.get(key)
  },
  
  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.connect()
    if (ttl) {
      await redis.setEx(key, ttl, value)
    } else {
      await redis.set(key, value)
    }
  },
  
  async del(key: string): Promise<void> {
    await this.connect()
    await redis.del(key)
  }
}
```

---
