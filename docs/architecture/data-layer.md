# Data Layer

## Database Schema (Prisma)

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

## Shared TypeScript Types

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
