# CompanyCam Roof Measurement - Fullstack Architecture Document

**Version:** 1.0 MVP  
**Date:** November 13, 2025  
**Status:** Ready for Development  
**Project ID:** ad0w8tJrc0PZKTA34A2Y_1762020579094

---

## Table of Contents

1. [Introduction](#introduction)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [ML Processing Pipeline](#ml-processing-pipeline)
8. [Data Layer](#data-layer)
9. [External Integrations](#external-integrations)
10. [Security & Authentication](#security--authentication)
11. [Performance & Scalability](#performance--scalability)
12. [Error Handling & Resilience](#error-handling--resilience)
13. [Monitoring & Observability](#monitoring--observability)
14. [Deployment Strategy](#deployment-strategy)
15. [Development Workflow](#development-workflow)

---

## Introduction

This document outlines the complete fullstack architecture for CompanyCam's Precision Roof Measurement & Complexity Mapping system. The solution leverages AI-driven analysis of satellite imagery and LiDAR data to deliver accurate roof measurements in under 5 minutes, achieving ±3% accuracy without expensive third-party vendors.

### Architecture Philosophy

The architecture is designed around these core principles:

1. **Mobile-First** - Optimized for contractors working on-site with clients
2. **Hybrid AI + Mobile** - Combines satellite/LiDAR analysis with optional smartphone capture for obstructed roofs
3. **Cost-Conscious** - Leverages free public data sources (Sentinel-2, USGS 3DEP LiDAR)
4. **Progressive Enhancement** - Falls back gracefully when satellite data has obstructions
5. **Rapid Results** - Delivers measurements in 2-5 minutes for primary flow
6. **Developer Experience** - Clear patterns for AI-assisted development

### Project Type

**Greenfield Full-Stack Web Application** with:
- Frontend: Next.js 14 + React 18
- Backend: Next.js API Routes + Python ML Services
- ML Pipeline: Mask R-CNN for roof detection + LiDAR processing
- Infrastructure: Vercel (frontend/API) + AWS Lambda (ML processing)

---

## High-Level Architecture

### Technical Summary

The system follows a **hybrid serverless architecture** combining:
- **Next.js full-stack framework** for web app and API layer
- **Serverless ML processing** on AWS Lambda for compute-intensive tasks
- **Event-driven architecture** for asynchronous ML pipeline execution
- **Progressive web app** patterns for mobile-first experience

This architecture achieves the PRD's goals of <5 minute results and ±3% accuracy by:
1. Leveraging free public datasets (Sentinel-2 satellite, USGS LiDAR)
2. Pre-trained Mask R-CNN models for roof detection (~90% accuracy)
3. Parallel processing of satellite imagery and LiDAR point clouds
4. Mobile camera capture fallback for obstructed properties

### System Overview

```mermaid
graph TB
    User[Contractor User] --> WebApp[Next.js Web App]
    WebApp --> API[Next.js API Routes]
    API --> Cache[(Redis Cache)]
    API --> DB[(PostgreSQL DB)]
    API --> Queue[SQS Queue]
    
    Queue --> MLProcessor[Lambda ML Processor]
    MLProcessor --> Sentinel[Sentinel-2 API]
    MLProcessor --> LiDAR[USGS 3DEP LiDAR]
    MLProcessor --> MaskRCNN[Mask R-CNN Model]
    MLProcessor --> S3[S3 Storage]
    
    WebApp --> Camera[Mobile Camera]
    Camera --> API
    
    API --> PDF[PDF Generator]
    WebApp --> Maps[Google Maps API]
    
    S3 -.->|Results| API
    
    style User fill:#6b7c6e
    style WebApp fill:#3b82f6
    style MLProcessor fill:#f59e0b
    style MaskRCNN fill:#22c55e
```

### Architectural Patterns

**1. API Gateway Pattern**
- Next.js API Routes act as gateway to ML services
- Request validation, authentication, rate limiting at edge
- Async job submission for long-running ML tasks

**2. Queue-Based Processing**
- SQS for decoupling web tier from ML processing
- Enables horizontal scaling of ML workers
- Provides retry logic and dead letter queues

**3. CQRS (Command Query Responsibility Segregation)**
- Write path: User submits address → Queue → ML processing → Write results
- Read path: User polls for results → Cache-first → Database fallback
- Optimizes for fast reads on results page

**4. Repository Pattern**
- Data access layer abstracts database operations
- Shared TypeScript interfaces between frontend/backend
- Enables testing with mock repositories

**5. Fallback Pattern**
- Primary: Satellite + LiDAR analysis
- Secondary: Mobile-assisted capture for obstructions
- Tertiary: Partial results with confidence indicators

---

## Technology Stack

### Frontend Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Framework | Next.js | 14.2+ | React framework with SSR/SSG | App Router, server components, built-in API routes |
| UI Library | React | 18.3+ | Component-based UI | Industry standard, extensive ecosystem |
| UI Components | shadcn/ui | Latest | Pre-built accessible components | Tailwind-based, customizable, accessible |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS | Matches UX spec, rapid development |
| Type Safety | TypeScript | 5.0+ | Static typing | Prevents runtime errors, better DX |
| State Management | React Context + Hooks | Built-in | Local state management | Sufficient for MVP, no Redux needed |
| Forms | React Hook Form | 7.x | Form validation | Performance, minimal re-renders |
| Camera | react-webcam | 7.2+ | Camera capture | Mobile camera integration |
| Maps | @vis.gl/react-google-maps | 1.0+ | Address autocomplete | Google Places API wrapper |
| PDF Generation | jsPDF + html2canvas | 2.5+, 1.4+ | Client-side PDF export | No server processing needed |
| HTTP Client | Native fetch | Built-in | API requests | Modern, no axios needed |
| Icons | lucide-react | 0.400+ | Icon system | Tree-shakeable, matches UX spec |

### Backend Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| API Framework | Next.js API Routes | 14.2+ | REST API endpoints | Collocated with frontend, TypeScript |
| Database | PostgreSQL | 15+ | Primary datastore | JSONB for flexible schemas, PostGIS for geo |
| ORM | Prisma | 5.x | Database ORM | Type-safe queries, migrations |
| Cache | Redis | 7.x | Results caching | Fast reads for polling, reduces DB load |
| Queue | AWS SQS | - | Async job queue | Managed service, reliable delivery |
| Object Storage | AWS S3 | - | Image/PDF storage | Durable, CDN integration |
| File Upload | Vercel Blob | Latest | Temporary photo storage | Integrated with Next.js deployment |

### ML Processing Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Runtime | Python | 3.11 | ML execution environment | Standard for ML/AI workloads |
| ML Framework | PyTorch | 2.0+ | Deep learning | Mask R-CNN pretrained models |
| Computer Vision | Detectron2 | Latest | Mask R-CNN implementation | Facebook Research, production-ready |
| LiDAR Processing | PDAL + Open3D | Latest | Point cloud analysis | Industry standard for LiDAR |
| Geospatial | GDAL + Rasterio | Latest | Satellite imagery | Read GeoTIFF, coordinate transforms |
| API Client | requests + boto3 | Latest | External API calls | Sentinel Hub, USGS, S3 access |
| Serverless Runtime | AWS Lambda | Python 3.11 | ML compute | Auto-scaling, pay-per-use |
| Container | Docker | Latest | Lambda packaging | Custom ML dependencies |

### External Services

| Service | Purpose | API/SDK |
|---------|---------|---------|
| Sentinel Hub | Satellite imagery | REST API (Free tier) |
| USGS 3DEP | LiDAR data | REST API (Free) |
| Google Maps | Address autocomplete | Places API |
| Vercel | Frontend hosting | Built-in |
| AWS Lambda | ML processing | boto3 SDK |
| AWS SQS | Job queue | boto3 SDK |
| AWS S3 | Object storage | boto3 SDK |

### Development Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Package Manager | pnpm | Fast, disk-efficient |
| Linting | ESLint | Code quality |
| Formatting | Prettier | Code style |
| Testing | Jest + React Testing Library | Unit/integration tests |
| E2E Testing | Playwright | End-to-end tests |
| API Testing | Postman | API development |
| Git Hooks | Husky | Pre-commit checks |

---

## System Architecture

### Repository Structure

**Monorepo** using Next.js convention:

```
companycam-roof-measurement/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # CI pipeline
│       └── deploy.yml              # Deployment
├── app/                            # Next.js App Router
│   ├── page.tsx                    # Screen 1: Address Input
│   ├── analyze/
│   │   └── page.tsx                # Screen 2: Processing
│   ├── results/
│   │   └── page.tsx                # Screen 3a: Results
│   ├── assist/
│   │   └── page.tsx                # Screen 3b: Mobile Assist
│   ├── api/                        # API Routes
│   │   ├── analyze/
│   │   │   └── route.ts            # POST /api/analyze
│   │   ├── results/
│   │   │   └── [id]/
│   │   │       └── route.ts        # GET /api/results/:id
│   │   └── assist/
│   │       └── upload/
│   │           └── route.ts        # POST /api/assist/upload
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── components/                     # React components
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── address-input.tsx
│   ├── place-autocomplete.tsx
│   ├── camera-modal.tsx
│   ├── photo-guide-card.tsx
│   └── measurement-card.tsx
├── lib/                            # Shared utilities
│   ├── db/                         # Database layer
│   │   ├── client.ts               # Prisma client
│   │   └── repositories/           # Repository pattern
│   │       ├── analysis-repo.ts
│   │       └── photo-repo.ts
│   ├── cache/                      # Redis cache
│   │   └── client.ts
│   ├── queue/                      # SQS queue
│   │   └── client.ts
│   ├── pdf-generator.ts            # PDF export
│   ├── image-utils.ts              # Image compression
│   └── utils.ts                    # General utils
├── types/                          # TypeScript types
│   ├── index.ts                    # Shared types
│   └── api.ts                      # API types
├── ml-service/                     # Python ML service
│   ├── Dockerfile                  # Lambda container
│   ├── requirements.txt            # Python dependencies
│   ├── handler.py                  # Lambda entrypoint
│   ├── models/
│   │   ├── roof_detector.py        # Mask R-CNN wrapper
│   │   └── lidar_processor.py      # LiDAR analysis
│   ├── services/
│   │   ├── sentinel_client.py      # Sentinel-2 API
│   │   ├── usgs_client.py          # USGS 3DEP API
│   │   └── measurement_service.py  # Core logic
│   └── tests/
│       └── test_*.py
├── prisma/                         # Database
│   ├── schema.prisma               # Prisma schema
│   └── migrations/                 # DB migrations
├── public/                         # Static assets
│   └── logo.svg
├── infrastructure/                 # IaC (optional)
│   └── terraform/                  # AWS resources
│       ├── lambda.tf
│       ├── sqs.tf
│       └── s3.tf
├── docs/                           # Documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md
├── .env.example                    # Environment template
├── .env.local                      # Local environment
├── next.config.js                  # Next.js config
├── tailwind.config.ts              # Tailwind config
├── tsconfig.json                   # TypeScript config
├── package.json                    # Dependencies
└── README.md

```

### Data Flow

#### Primary Flow (Success Path)

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant API
    participant Queue
    participant Lambda
    participant Sentinel
    participant USGS
    participant S3
    participant DB

    User->>WebApp: Enter address
    WebApp->>API: POST /api/analyze
    API->>DB: Create analysis record
    API->>Queue: Submit job {id, lat, lng, address}
    API->>WebApp: Return {analysisId, status: "queued"}
    WebApp->>WebApp: Navigate to processing screen
    
    Queue->>Lambda: Trigger ML processor
    Lambda->>Sentinel: Fetch satellite imagery
    Sentinel-->>Lambda: GeoTIFF (10m resolution)
    Lambda->>USGS: Fetch LiDAR data
    USGS-->>Lambda: Point cloud (LAZ)
    
    Lambda->>Lambda: Run Mask R-CNN
    Lambda->>Lambda: Calculate measurements
    Lambda->>S3: Store annotated images
    Lambda->>DB: Update analysis (measurements, confidence)
    
    loop Every 2 seconds
        WebApp->>API: GET /api/results/:id
        API->>DB: Query analysis
        DB-->>API: Status + results
        API-->>WebApp: Return data
    end
    
    WebApp->>User: Display results
```

#### Fallback Flow (Mobile Assist Path)

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant API
    participant Queue
    participant Lambda
    participant S3

    User->>WebApp: Complete initial analysis
    Lambda->>DB: Low confidence (<70%)
    WebApp->>User: Show mobile assist screen
    
    User->>WebApp: Capture 3 photos
    WebApp->>API: POST /api/assist/upload (photos)
    API->>S3: Store photos
    API->>Queue: Submit enhancement job
    
    Queue->>Lambda: Trigger enhanced processing
    Lambda->>S3: Retrieve photos
    Lambda->>Lambda: Merge with satellite data
    Lambda->>Lambda: Re-run Mask R-CNN
    Lambda->>DB: Update with improved results
    
    WebApp->>API: Poll for updated results
    API-->>WebApp: Return enhanced measurements
```

---

## Frontend Architecture

### Component Architecture

**Atomic Design Principles:**
- **Atoms:** Button, Input, Card (shadcn/ui primitives)
- **Molecules:** MeasurementCard, PhotoGuideCard, ProgressBar
- **Organisms:** AddressInput, CameraModal, ResultsGrid
- **Pages:** AddressInputPage, ProcessingPage, ResultsPage, MobileAssistPage

### Component Organization

```
components/
├── ui/                         # Atoms (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── progress.tsx
│   └── ...
├── molecules/                  # Molecules
│   ├── measurement-card.tsx    # Individual measurement display
│   ├── photo-guide-card.tsx    # Camera guidance UI
│   └── complexity-indicator.tsx
├── organisms/                  # Organisms
│   ├── address-input.tsx       # Complete address input form
│   ├── camera-modal.tsx        # Photo capture interface
│   ├── results-grid.tsx        # Full results display
│   └── place-autocomplete.tsx  # Google Maps integration
└── providers/                  # Context providers
    └── analysis-provider.tsx   # Analysis state management
```

### Component Template Example

```typescript
// components/molecules/measurement-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Measurement } from "@/types"

interface MeasurementCardProps {
  title: string
  value: number | string
  unit: string
  accuracy?: string
  className?: string
}

export function MeasurementCard({
  title,
  value,
  unit,
  accuracy,
  className
}: MeasurementCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-500">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold text-neutral-900">
          {value}
          <span className="text-lg font-normal text-neutral-500 ml-1">
            {unit}
          </span>
        </div>
        {accuracy && (
          <p className="text-xs text-neutral-400 mt-1">Â±{accuracy}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

### State Management

**React Context + Hooks** (no Redux needed for MVP):

```typescript
// lib/contexts/analysis-context.tsx
"use client"

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { type AnalysisResult } from '@/types'

interface AnalysisState {
  currentAnalysis: AnalysisResult | null
  isLoading: boolean
  error: string | null
}

type AnalysisAction =
  | { type: 'START_ANALYSIS'; payload: string }
  | { type: 'UPDATE_ANALYSIS'; payload: AnalysisResult }
  | { type: 'ANALYSIS_ERROR'; payload: string }
  | { type: 'RESET' }

const AnalysisContext = createContext<{
  state: AnalysisState
  dispatch: React.Dispatch<AnalysisAction>
} | null>(null)

function analysisReducer(state: AnalysisState, action: AnalysisAction): AnalysisState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return { ...state, isLoading: true, error: null }
    case 'UPDATE_ANALYSIS':
      return { ...state, currentAnalysis: action.payload, isLoading: false }
    case 'ANALYSIS_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    case 'RESET':
      return { currentAnalysis: null, isLoading: false, error: null }
    default:
      return state
  }
}

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(analysisReducer, {
    currentAnalysis: null,
    isLoading: false,
    error: null
  })

  return (
    <AnalysisContext.Provider value={{ state, dispatch }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const context = useContext(AnalysisContext)
  if (!context) throw new Error('useAnalysis must be used within AnalysisProvider')
  return context
}
```

### Routing

**Next.js App Router** (File-based routing):

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.tsx` | Address input (Screen 1) |
| `/analyze` | `app/analyze/page.tsx` | Processing screen (Screen 2) |
| `/results` | `app/results/page.tsx` | Results display (Screen 3a) |
| `/assist` | `app/assist/page.tsx` | Mobile assist (Screen 3b) |

**Route Protection:** No authentication in MVP, but prepare structure:

```typescript
// app/results/page.tsx
import { redirect } from 'next/navigation'

export default function ResultsPage({
  searchParams
}: {
  searchParams: { id?: string }
}) {
  if (!searchParams.id) {
    redirect('/')
  }
  
  // Render results...
}
```

### API Service Layer

```typescript
// lib/services/analysis-service.ts
import { type AnalysisRequest, type AnalysisResult } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export const analysisService = {
  async submitAnalysis(request: AnalysisRequest): Promise<{ analysisId: string }> {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error('Failed to submit analysis')
    }
    
    return response.json()
  },
  
  async getAnalysis(id: string): Promise<AnalysisResult> {
    const response = await fetch(`${API_BASE}/results/${id}`, {
      cache: 'no-store' // Disable caching for polling
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch analysis')
    }
    
    return response.json()
  },
  
  async uploadPhotos(analysisId: string, photos: File[]): Promise<void> {
    const formData = new FormData()
    formData.append('analysisId', analysisId)
    photos.forEach((photo, i) => formData.append(`photo${i}`, photo))
    
    const response = await fetch(`${API_BASE}/assist/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload photos')
    }
  }
}
```

### Styling System

**Tailwind CSS** with design tokens from UX spec:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          DEFAULT: '#6b7c6e',
          dark: '#5a6b5d',
          light: '#8a9b8d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
```

---

## Backend Architecture

### API Routes Architecture

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

### Repository Pattern

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

### Queue Service

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

### Cache Service

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

## ML Processing Pipeline

### Lambda Handler Architecture

```python
# ml-service/handler.py
import json
import logging
from typing import Dict, Any

from services.sentinel_client import SentinelClient
from services.usgs_client import USGSClient
from services.measurement_service import MeasurementService
from models.roof_detector import RoofDetector

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize services (reused across invocations)
sentinel_client = SentinelClient()
usgs_client = USGSClient()
roof_detector = RoofDetector()
measurement_service = MeasurementService(sentinel_client, usgs_client, roof_detector)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for roof measurement ML processing.
    
    Input (SQS message):
      {
        "analysisId": "uuid",
        "address": "1234 Main St, Austin, TX",
        "coordinates": {"lat": 30.2672, "lng": -97.7431}
      }
    
    Output:
      Updates database with measurements or error status
    """
    try:
        # Parse SQS message
        records = event.get('Records', [])
        if not records:
            return {'statusCode': 400, 'body': 'No SQS records'}
        
        message = json.loads(records[0]['body'])
        analysis_id = message['analysisId']
        coordinates = message['coordinates']
        
        logger.info(f"Processing analysis {analysis_id}")
        
        # Run ML pipeline
        result = measurement_service.analyze_roof(
            analysis_id=analysis_id,
            lat=coordinates['lat'],
            lng=coordinates['lng']
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"Pipeline error: {str(e)}", exc_info=True)
        
        # Update database with error status
        # (implementation would call database update here)
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

### Measurement Service

```python
# ml-service/services/measurement_service.py
import logging
from typing import Dict, Any, Tuple
import numpy as np
from shapely.geometry import Polygon

logger = logging.getLogger(__name__)

class MeasurementService:
    """Core service orchestrating roof measurement pipeline."""
    
    def __init__(self, sentinel_client, usgs_client, roof_detector):
        self.sentinel = sentinel_client
        self.usgs = usgs_client
        self.detector = roof_detector
    
    def analyze_roof(
        self,
        analysis_id: str,
        lat: float,
        lng: float
    ) -> Dict[str, Any]:
        """
        Complete roof analysis pipeline.
        
        Steps:
        1. Fetch satellite imagery (Sentinel-2)
        2. Fetch LiDAR data (USGS 3DEP)
        3. Run Mask R-CNN detection
        4. Calculate measurements
        5. Store results
        
        Returns:
            Dict containing measurements and confidence scores
        """
        try:
            # Step 1: Fetch satellite imagery
            logger.info(f"Fetching satellite imagery for {lat}, {lng}")
            satellite_image = self.sentinel.fetch_imagery(lat, lng)
            
            # Step 2: Fetch LiDAR data
            logger.info("Fetching LiDAR data")
            lidar_data = self.usgs.fetch_lidar(lat, lng)
            
            # Step 3: Detect roof boundaries
            logger.info("Running roof detection")
            detections = self.detector.detect_roof(satellite_image)
            
            if not detections or len(detections) == 0:
                logger.warning("No roof detected, requesting mobile assist")
                return {
                    'status': 'needs_assist',
                    'confidence': 0,
                    'message': 'Unable to detect roof from satellite imagery'
                }
            
            # Step 4: Calculate measurements
            logger.info("Calculating measurements")
            roof_polygon = detections[0]['polygon']
            measurements = self._calculate_measurements(
                roof_polygon,
                lidar_data,
                satellite_image.resolution
            )
            
            # Step 5: Calculate confidence
            confidence = self._calculate_confidence(detections[0], lidar_data)
            
            logger.info(f"Analysis complete: confidence={confidence}%")
            
            return {
                'status': 'completed' if confidence >= 70 else 'needs_assist',
                'confidence': confidence,
                'measurements': measurements,
                'detections': detections
            }
            
        except Exception as e:
            logger.error(f"Analysis failed: {str(e)}", exc_info=True)
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    def _calculate_measurements(
        self,
        polygon: Polygon,
        lidar_data: np.ndarray,
        resolution: float
    ) -> Dict[str, Any]:
        """Calculate roof measurements from polygon and LiDAR."""
        
        # Calculate area (convert pixels to square feet)
        area_pixels = polygon.area
        area_sqft = area_pixels * (resolution ** 2) * 10.764  # m² to ft²
        
        # Calculate perimeter
        perimeter_pixels = polygon.length
        perimeter_ft = perimeter_pixels * resolution * 3.281  # m to ft
        
        # Calculate pitch from LiDAR
        pitch, slope = self._calculate_pitch(lidar_data, polygon)
        
        # Detect features
        features = self._detect_features(lidar_data, polygon)
        
        return {
            'total_area': round(area_sqft, 2),
            'perimeter': round(perimeter_ft, 2),
            'pitch': pitch,
            'slope': round(slope, 1),
            'features': features
        }
    
    def _calculate_pitch(
        self,
        lidar_data: np.ndarray,
        polygon: Polygon
    ) -> Tuple[str, float]:
        """Calculate roof pitch from LiDAR elevation data."""
        
        # Extract elevation points within roof polygon
        # (simplified - actual implementation would be more sophisticated)
        
        elevations = lidar_data  # Simplified
        
        if len(elevations) < 2:
            return "Unknown", 0.0
        
        # Calculate slope
        min_elev = np.min(elevations)
        max_elev = np.max(elevations)
        rise = max_elev - min_elev
        
        # Estimate run (simplified)
        run = polygon.bounds[2] - polygon.bounds[0]  # Width
        
        slope = (rise / run) * 100 if run > 0 else 0
        
        # Convert to pitch notation
        if slope < 10:
            pitch = "Flat"
        elif slope < 25:
            pitch = "Low (4/12)"
        elif slope < 50:
            pitch = "Medium (6/12)"
        else:
            pitch = "Steep (9/12)"
        
        return pitch, slope
    
    def _detect_features(
        self,
        lidar_data: np.ndarray,
        polygon: Polygon
    ) -> Dict[str, int]:
        """Detect roof features (vents, chimneys, etc.)."""
        
        # Simplified feature detection
        # Actual implementation would use computer vision techniques
        
        return {
            'vents': 0,
            'chimneys': 0,
            'skylights': 0,
            'dormers': 0
        }
    
    def _calculate_confidence(
        self,
        detection: Dict[str, Any],
        lidar_data: np.ndarray
    ) -> float:
        """Calculate confidence score for measurements."""
        
        # Factors:
        # 1. Detection confidence from Mask R-CNN
        model_confidence = detection.get('score', 0.5)
        
        # 2. LiDAR data quality
        lidar_quality = 1.0 if lidar_data is not None else 0.5
        
        # 3. Image quality (cloud cover, shadows)
        image_quality = 0.9  # Simplified
        
        # Weighted average
        confidence = (
            model_confidence * 0.5 +
            lidar_quality * 0.3 +
            image_quality * 0.2
        ) * 100
        
        return round(confidence, 1)
```

### Roof Detector (Mask R-CNN)

```python
# ml-service/models/roof_detector.py
import torch
import numpy as np
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo
from shapely.geometry import Polygon
import logging

logger = logging.getLogger(__name__)

class RoofDetector:
    """Mask R-CNN based roof detection."""
    
    def __init__(self):
        """Initialize Mask R-CNN model."""
        self.cfg = get_cfg()
        
        # Load pre-trained model
        self.cfg.merge_from_file(
            model_zoo.get_config_file("COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml")
        )
        self.cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(
            "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
        )
        
        # Fine-tuned for roofs (would use custom weights in production)
        # self.cfg.MODEL.WEIGHTS = "s3://bucket/roof_model_weights.pth"
        
        self.cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.7
        self.cfg.MODEL.DEVICE = "cpu"  # Lambda uses CPU
        
        self.predictor = DefaultPredictor(self.cfg)
        
        logger.info("Roof detector initialized")
    
    def detect_roof(self, image: np.ndarray) -> list:
        """
        Detect roof in satellite image.
        
        Args:
            image: RGB image array (H, W, 3)
        
        Returns:
            List of detections, each containing:
            - polygon: Shapely Polygon of roof boundary
            - score: Confidence score (0-1)
            - mask: Binary mask
        """
        try:
            # Run inference
            outputs = self.predictor(image)
            
            instances = outputs["instances"].to("cpu")
            
            # Filter for building class (fine-tuned model would have roof class)
            # For now, assume largest detection is the roof
            
            if len(instances) == 0:
                logger.warning("No detections found")
                return []
            
            # Get largest detection (likely the roof)
            areas = instances.pred_masks.sum(dim=(1, 2))
            largest_idx = torch.argmax(areas).item()
            
            mask = instances.pred_masks[largest_idx].numpy()
            score = instances.scores[largest_idx].item()
            
            # Convert mask to polygon
            polygon = self._mask_to_polygon(mask)
            
            return [{
                'polygon': polygon,
                'score': score,
                'mask': mask
            }]
            
        except Exception as e:
            logger.error(f"Detection failed: {str(e)}", exc_info=True)
            return []
    
    def _mask_to_polygon(self, mask: np.ndarray) -> Polygon:
        """Convert binary mask to polygon."""
        from skimage import measure
        
        # Find contours
        contours = measure.find_contours(mask, 0.5)
        
        if len(contours) == 0:
            return Polygon()
        
        # Use largest contour
        largest_contour = max(contours, key=len)
        
        # Convert to Shapely polygon
        # Swap x/y because find_contours returns (row, col)
        coords = [(y, x) for x, y in largest_contour]
        
        return Polygon(coords)
```

### External Data Clients

```python
# ml-service/services/sentinel_client.py
import requests
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class SentinelClient:
    """Client for Sentinel Hub API (Sentinel-2 satellite imagery)."""
    
    def __init__(self):
        self.base_url = "https://services.sentinel-hub.com/api/v1"
        self.client_id = os.environ.get('SENTINEL_CLIENT_ID')
        self.client_secret = os.environ.get('SENTINEL_CLIENT_SECRET')
        self.token = None
    
    def fetch_imagery(
        self,
        lat: float,
        lng: float,
        radius_m: float = 100
    ) -> np.ndarray:
        """
        Fetch Sentinel-2 imagery for coordinates.
        
        Args:
            lat: Latitude
            lng: Longitude
            radius_m: Radius in meters around point
        
        Returns:
            RGB image array (H, W, 3)
        """
        try:
            # Get authentication token
            if not self.token:
                self._authenticate()
            
            # Calculate bounding box
            bbox = self._calculate_bbox(lat, lng, radius_m)
            
            # Request imagery from last 30 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
            
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: ["B04", "B03", "B02"],
                    output: { bands: 3 }
                };
            }
            function evaluatePixel(sample) {
                return [sample.B04, sample.B03, sample.B02];
            }
            """
            
            request_payload = {
                "input": {
                    "bounds": {
                        "bbox": bbox,
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": start_date.isoformat() + "Z",
                                "to": end_date.isoformat() + "Z"
                            },
                            "maxCloudCoverage": 20
                        }
                    }]
                },
                "output": {
                    "width": 512,
                    "height": 512,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/png"}
                    }]
                },
                "evalscript": evalscript
            }
            
            response = requests.post(
                f"{self.base_url}/process",
                headers={"Authorization": f"Bearer {self.token}"},
                json=request_payload
            )
            
            response.raise_for_status()
            
            # Convert to numpy array
            from PIL import Image
            import io
            
            image = Image.open(io.BytesIO(response.content))
            image_array = np.array(image)
            
            logger.info(f"Fetched imagery: shape={image_array.shape}")
            
            return image_array
            
        except Exception as e:
            logger.error(f"Failed to fetch imagery: {str(e)}")
            raise
    
    def _authenticate(self):
        """Authenticate with Sentinel Hub."""
        response = requests.post(
            "https://services.sentinel-hub.com/oauth/token",
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret
            }
        )
        response.raise_for_status()
        self.token = response.json()['access_token']
    
    def _calculate_bbox(self, lat: float, lng: float, radius_m: float) -> list:
        """Calculate bounding box around point."""
        # Approximate: 1 degree ≈ 111km
        lat_offset = radius_m / 111000
        lng_offset = radius_m / (111000 * np.cos(np.radians(lat)))
        
        return [
            lng - lng_offset,
            lat - lat_offset,
            lng + lng_offset,
            lat + lat_offset
        ]
```

```python
# ml-service/services/usgs_client.py
import requests
import numpy as np
import logging

logger = logging.getLogger(__name__)

class USGSClient:
    """Client for USGS 3DEP LiDAR data."""
    
    def __init__(self):
        self.base_url = "https://elevation.nationalmap.gov/arcgis/rest/services"
    
    def fetch_lidar(
        self,
        lat: float,
        lng: float,
        radius_m: float = 100
    ) -> np.ndarray:
        """
        Fetch LiDAR point cloud data.
        
        Args:
            lat: Latitude
            lng: Longitude
            radius_m: Radius around point
        
        Returns:
            Elevation array
        """
        try:
            # Query USGS elevation service
            params = {
                'x': lng,
                'y': lat,
                'units': 'Meters',
                'output': 'json'
            }
            
            response = requests.get(
                f"{self.base_url}/3DEPElevation/ImageServer/identify",
                params=params
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Extract elevation data
            elevation = data.get('value', 0)
            
            # Simplified: return single elevation
            # Production would fetch full point cloud
            logger.info(f"Fetched LiDAR: elevation={elevation}m")
            
            return np.array([elevation])
            
        except Exception as e:
            logger.warning(f"LiDAR fetch failed: {str(e)}")
            return None
```

---

## Data Layer

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Analysis {
  id              String       @id @default(uuid())
  address         String
  latitude        Float
  longitude       Float
  status          AnalysisStatus @default(QUEUED)
  
  // Results
  confidence      Float?
  errorMessage    String?
  
  // Timestamps
  createdAt       DateTime     @default(now())
  completedAt     DateTime?
  
  // Relations
  measurements    Measurements?
  photos          Photo[]
  
  @@index([status, createdAt])
}

enum AnalysisStatus {
  QUEUED
  PROCESSING
  COMPLETED
  NEEDS_ASSIST
  FAILED
}

model Measurements {
  id          String   @id @default(uuid())
  analysisId  String   @unique
  analysis    Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  
  // Core measurements
  totalArea   Float    // square feet
  perimeter   Float    // feet
  pitch       String   // e.g., "6/12"
  slope       Float    // percentage
  
  // Complexity
  complexity  Int      // 1-10 scale
  
  // Features
  vents       Int      @default(0)
  chimneys    Int      @default(0)
  skylights   Int      @default(0)
  dormers     Int      @default(0)
  satelliteDishes Int  @default(0)
  
  // Storage URLs
  satelliteImageUrl String?
  annotatedImageUrl String?
  
  createdAt   DateTime @default(now())
}

model Photo {
  id          String   @id @default(uuid())
  analysisId  String
  analysis    Analysis @relation(fields: [analysisId], references: [id], onDelete: Cascade)
  
  url         String
  angle       String   // "front", "left", "right"
  uploadedAt  DateTime @default(now())
  
  @@index([analysisId])
}
```

### Shared TypeScript Types

```typescript
// types/index.ts

export interface Analysis {
  id: string
  address: string
  latitude: number
  longitude: number
  status: AnalysisStatus
  confidence: number | null
  errorMessage: string | null
  createdAt: Date
  completedAt: Date | null
  measurements?: Measurements
  photos?: Photo[]
}

export enum AnalysisStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  NEEDS_ASSIST = 'NEEDS_ASSIST',
  FAILED = 'FAILED'
}

export interface Measurements {
  id: string
  analysisId: string
  totalArea: number
  perimeter: number
  pitch: string
  slope: number
  complexity: number
  vents: number
  chimneys: number
  skylights: number
  dormers: number
  satelliteDishes: number
  satelliteImageUrl: string | null
  annotatedImageUrl: string | null
  createdAt: Date
}

export interface Photo {
  id: string
  analysisId: string
  url: string
  angle: 'front' | 'left' | 'right'
  uploadedAt: Date
}

// API request/response types

export interface AnalyzeRequest {
  address: string
  lat: number
  lng: number
}

export interface AnalyzeResponse {
  analysisId: string
  status: AnalysisStatus
}

export interface AnalysisResult extends Analysis {
  measurements?: Measurements
  photos?: Photo[]
}
```

---

## External Integrations

### Google Maps Places API

**Purpose:** Address autocomplete  
**Authentication:** API Key  
**Rate Limits:** 1000 requests/day (free tier)

```typescript
// Usage in PlaceAutocomplete component
import { useMapsLibrary } from '@vis.gl/react-google-maps'

export function PlaceAutocomplete({ onPlaceSelect }) {
  const places = useMapsLibrary('places')
  
  useEffect(() => {
    if (!places) return
    
    const autocomplete = new places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    })
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      onPlaceSelect(place)
    })
  }, [places])
  
  return <input ref={inputRef} />
}
```

### Sentinel Hub API

**Purpose:** Sentinel-2 satellite imagery  
**Authentication:** OAuth 2.0 Client Credentials  
**Rate Limits:** 30,000 processing units/month (free tier)  
**Cost:** Free for MVP, $0.02/processing unit after

### USGS 3DEP

**Purpose:** LiDAR elevation data  
**Authentication:** None (public API)  
**Rate Limits:** None documented  
**Cost:** Free

### AWS Services

**SQS:** Message queue for async ML processing  
**Lambda:** Serverless compute for ML pipeline  
**S3:** Object storage for images and PDFs  
**CloudWatch:** Logging and monitoring

---

## Security & Authentication

### MVP Security (No Auth)

For MVP, no user authentication required:
- Public API endpoints
- Rate limiting via Vercel edge config
- Input validation with Zod schemas
- CORS configured for same-origin only

### Future Authentication

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

### Data Security

1. **API Keys:** Environment variables only, never in code
2. **Database:** Connection via SSL, credentials rotated
3. **S3:** Pre-signed URLs with expiration (1 hour)
4. **Secrets:** AWS Secrets Manager for production
5. **Input Validation:** Zod schemas on all API routes

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Page Load (LCP) | <2.5s | Code splitting, image optimization |
| API Response | <200ms | Redis caching, database indexes |
| ML Processing | <5min | Parallel processing, optimized models |
| Concurrent Users | 100 | Vercel auto-scaling, Lambda concurrency |

### Frontend Optimization

1. **Code Splitting:** Lazy load camera and PDF components
2. **Image Optimization:** Next.js Image component with WebP
3. **Caching:** Service worker for offline capability (future)
4. **Bundle Size:** Tree-shaking, dynamic imports

### Backend Optimization

1. **Database Indexes:** On `status`, `createdAt`, `analysisId`
2. **Connection Pooling:** Prisma connection pool (10 connections)
3. **Redis Caching:** 1-hour TTL for completed analyses
4. **Query Optimization:** Select only needed fields

### ML Pipeline Optimization

1. **Model Loading:** Pre-load Mask R-CNN in Lambda cold start
2. **Parallel Processing:** Fetch Sentinel + LiDAR concurrently
3. **Image Preprocessing:** Resize to 512x512 before inference
4. **Lambda Memory:** 3GB for ML workloads (CPU-optimized)

### Scalability Strategy

**Horizontal Scaling:**
- **Frontend:** Vercel edge network (automatic)
- **API:** Vercel serverless functions (automatic)
- **ML:** Lambda concurrency (up to 1000 concurrent)
- **Database:** PostgreSQL read replicas (future)

**Vertical Scaling:**
- **Lambda Memory:** Increase to 10GB if needed
- **Database:** Upgrade to larger instance
- **Redis:** Upgrade to cluster mode

---

## Error Handling & Resilience

### Error Handling Strategy

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

### Fallback Mechanisms

1. **Satellite Data Unavailable:** Trigger mobile assist immediately
2. **LiDAR Unavailable:** Calculate pitch from satellite imagery only
3. **Low Confidence (<70%):** Request mobile photos
4. **API Timeout:** Show retry button with helpful message

### Circuit Breaker Pattern

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

## Monitoring & Observability

### Logging Strategy

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

### Metrics to Track

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| API Response Time | Vercel Analytics | >500ms (p95) |
| ML Processing Time | CloudWatch | >10 min |
| Error Rate | CloudWatch | >5% |
| Database Connections | Prisma Metrics | >80% pool |
| Lambda Concurrency | CloudWatch | >800 |
| Cache Hit Rate | Redis INFO | <70% |

### Health Checks

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

## Deployment Strategy

### Infrastructure

**Production Stack:**
- **Frontend + API:** Vercel (serverless, edge network)
- **Database:** Heroku PostgreSQL (or AWS RDS)
- **Cache:** Upstash Redis (serverless Redis)
- **ML Processing:** AWS Lambda + ECR (Docker containers)
- **Queue:** AWS SQS
- **Storage:** AWS S3 + CloudFront CDN

### Deployment Workflow

```mermaid
graph LR
    Dev[Developer] --> Git[Git Push]
    Git --> CI[GitHub Actions CI]
    CI --> Tests[Run Tests]
    Tests --> Preview[Vercel Preview]
    Preview --> Review[Code Review]
    Review --> Merge[Merge to Main]
    Merge --> Vercel[Vercel Production]
    Merge --> Lambda[Deploy Lambda]
    Lambda --> Done[Deployed]
    Vercel --> Done
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
  
  deploy-lambda:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Lambda Docker image
        run: |
          cd ml-service
          docker build -t roof-ml-processor .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag roof-ml-processor:latest $ECR_REGISTRY/roof-ml-processor:latest
          docker push $ECR_REGISTRY/roof-ml-processor:latest
      - name: Update Lambda function
        run: |
          aws lambda update-function-code \
            --function-name roof-ml-processor \
            --image-uri $ECR_REGISTRY/roof-ml-processor:latest
```

### Environment Configuration

```bash
# .env.example

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_maps_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/companycam

# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
ML_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123/roof-ml-queue
S3_BUCKET=companycam-roof-measurements

# Sentinel Hub
SENTINEL_CLIENT_ID=your_sentinel_id
SENTINEL_CLIENT_SECRET=your_sentinel_secret
```

### Rollback Strategy

1. **Frontend:** Vercel instant rollback via dashboard
2. **Lambda:** AWS Lambda version aliases
3. **Database:** Prisma migration rollback
4. **Feature Flags:** Environment variables for quick toggles

---

## Development Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/companycam/roof-measurement.git
cd roof-measurement

# 2. Install dependencies
pnpm install

# 3. Setup database
docker-compose up -d postgres redis
pnpm prisma migrate dev

# 4. Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 5. Start development server
pnpm dev
```

### Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "ml:test": "cd ml-service && pytest"
  }
}
```

### Git Workflow

1. **Feature Branch:** `git checkout -b feature/roof-detection-improvements`
2. **Commit:** Follow conventional commits (`feat:`, `fix:`, `docs:`)
3. **Push:** Triggers preview deployment on Vercel
4. **PR:** Code review + automated tests
5. **Merge:** Deploy to production

### Testing Strategy

**1. Unit Tests (Jest)**
- Utils functions
- Repository methods
- React hooks

**2. Integration Tests (Jest + Supertest)**
- API routes
- Database operations
- Queue interactions

**3. E2E Tests (Playwright)**
- Full user flows
- Mobile assist flow
- PDF generation

**4. ML Tests (Pytest)**
- Roof detection accuracy
- Measurement calculations
- External API mocks

```typescript
// Example test
describe('Analysis API', () => {
  it('should create analysis', async () => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        address: '1234 Main St',
        lat: 30.2672,
        lng: -97.7431
      })
    })
    
    expect(response.status).toBe(202)
    const data = await response.json()
    expect(data).toHaveProperty('analysisId')
  })
})
```

### Code Quality Standards

1. **TypeScript:** Strict mode enabled
2. **ESLint:** Airbnb + React rules
3. **Prettier:** Auto-format on save
4. **Husky:** Pre-commit hooks for lint + test
5. **Conventional Commits:** Required for meaningful history

---

## Architecture Decision Records

### ADR-001: Next.js Full-Stack Framework

**Status:** Accepted  
**Date:** 2025-11-13

**Context:**  
Need unified framework for frontend and backend.

**Decision:**  
Use Next.js 14 with App Router for full-stack development.

**Rationale:**
- Single TypeScript codebase
- Built-in API routes (no separate Express server)
- Vercel deployment optimization
- React Server Components for performance
- Strong ecosystem and community

**Consequences:**
- Vendor lock-in to Vercel (mitigated: can deploy elsewhere)
- Learning curve for App Router
- Excellent developer experience

---

### ADR-002: Serverless ML Processing

**Status:** Accepted  
**Date:** 2025-11-13

**Context:**  
ML processing is compute-intensive and sporadic.

**Decision:**  
Use AWS Lambda with Docker containers for ML pipeline.

**Rationale:**
- Pay-per-use pricing (cost-effective for MVP)
- Auto-scaling without management
- 15-minute timeout sufficient for processing
- Container support allows custom ML dependencies
- Parallel execution for high throughput

**Consequences:**
- Cold start latency (~2-5s)
- 10GB memory limit
- No GPU support (use CPU-optimized models)

---

### ADR-003: Public Data Sources

**Status:** Accepted  
**Date:** 2025-11-13

**Context:**  
Minimize costs while achieving ±3% accuracy.

**Decision:**  
Use Sentinel-2 (free) and USGS 3DEP LiDAR (free) instead of paid services.

**Rationale:**
- Sentinel-2: 10m resolution sufficient for roof detection
- USGS LiDAR: 10cm vertical accuracy excellent for pitch
- Combined cost: $0 vs competitors $25-75 per report
- Based on Mary's technical research validation

**Consequences:**
- 10m resolution requires robust ML models
- May need mobile assist for obstructed properties
- Updates lag 5-7 days (acceptable for use case)

---

### ADR-004: Hybrid AI + Mobile Approach

**Status:** Accepted  
**Date:** 2025-11-13

**Context:**  
Satellite imagery may have obstructions (trees, shadows).

**Decision:**  
Implement fallback flow with mobile camera capture.

**Rationale:**
- Primary: Fast satellite analysis (80% success rate)
- Fallback: Mobile photos for obstructed roofs
- Maintains <5 minute target for most users
- Better UX than "analysis failed"

**Consequences:**
- Increased complexity (two flows)
- Mobile camera UX critical
- Additional storage costs

---

## Critical Development Notes

### For AI Development Agents

**1. Type Safety:**
- Use Zod schemas for API validation
- Share TypeScript interfaces between frontend/backend
- Never use `any` type

**2. Error Handling:**
- Always wrap async calls in try-catch
- Return structured error responses
- Log errors with context

**3. Performance:**
- Use React.memo for expensive components
- Lazy load camera and PDF components
- Cache API responses

**4. Testing:**
- Write tests before implementation
- Mock external APIs (Sentinel, USGS, Google Maps)
- Test error states

**5. Mobile-First:**
- Test on actual mobile devices
- Touch targets ≥44px
- Optimize images for mobile networks

### Known Limitations

1. **Satellite Resolution:** 10m may struggle with complex roofs
2. **LiDAR Coverage:** Not available everywhere in US
3. **Processing Time:** 2-5 minutes for satellite path
4. **ML Accuracy:** ~85-95% depending on conditions
5. **Mobile Camera:** Requires good lighting

### Future Enhancements

See `CompanyCam_Roof_Measurement_Future_Enhancements.md` for:
- Advanced AR measurement tools
- Real-time collaboration
- Material recommendations
- Cost estimation
- Offline mode

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Nov 13, 2025 | Initial fullstack architecture | Winston (Architect) |

---

## Approval & Sign-Off

**Architecture Review:**
- [ ] Technical feasibility validated
- [ ] Cost estimates approved
- [ ] Security review completed
- [ ] Scalability plan confirmed

**Next Steps:**
1. **PO Review:** Validate architecture against PRD
2. **Team Sync:** Walkthrough with developers
3. **Environment Setup:** Create AWS/Vercel accounts
4. **Shard Documents:** Prepare for story creation
5. **Story Creation:** Begin Epic 1 Story 1

---

**Questions or Concerns?**  
Contact: winston@companycam.dev

**Reference Documents:**
- PRD: `PRD_CompanyCam_Precision_Roof_Measurement_Complexity_Mapping.md`
- UX Spec: `CompanyCam_Roof_Measurement_UX_Spec.md`
- Technical Research: `technical_research_roof_measurement.md`
- Technical Spec: `CompanyCam_Roof_Measurement_Technical_Spec.md`
