# Frontend Architecture

## Component Architecture

**Atomic Design Principles:**
- **Atoms:** Button, Input, Card (shadcn/ui primitives)
- **Molecules:** MeasurementCard, PhotoGuideCard, ProgressBar
- **Organisms:** AddressInput, CameraModal, ResultsGrid
- **Pages:** AddressInputPage, ProcessingPage, ResultsPage, MobileAssistPage

## Component Organization

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

## Component Template Example

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

## State Management

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

## Routing

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

## API Service Layer

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

## Styling System

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
