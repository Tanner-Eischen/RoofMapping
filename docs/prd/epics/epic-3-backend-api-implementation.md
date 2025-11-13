# Epic 3: Backend API Implementation

**Epic Goal:** Build the REST API endpoints for analysis submission, results retrieval, and photo uploads.

**Epic Priority:** P0 (Must-have for MVP)

---

## Story 3.1: Analysis Submission Endpoint

**As a** frontend application  
**I want** to submit an address for roof analysis  
**So that** the ML processing can begin

**API Endpoint:** `POST /api/analyze`

**Acceptance Criteria:**
- [ ] API route created (`app/api/analyze/route.ts`)
- [ ] Request validation with Zod schema (address, lat, lng)
- [ ] Create analysis record in database (status: "queued")
- [ ] Return 202 Accepted with analysisId
- [ ] Error handling for invalid requests (400)
- [ ] Error handling for database failures (500)
- [ ] Logging of analysis submissions
- [ ] Rate limiting configured (100 requests/hour per IP)

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** Story 1.2

**Request Body:**
```json
{
  "address": "1234 Main St, Austin, TX 78701",
  "lat": 30.2672,
  "lng": -97.7431
}
```

**Response:**
```json
{
  "analysisId": "uuid",
  "status": "queued"
}
```

---

## Story 3.2: SQS Queue Integration

**As a** backend API  
**I want** to submit analysis jobs to an SQS queue  
**So that** ML processing is decoupled from the web tier

**Acceptance Criteria:**
- [ ] AWS SQS queue created (Terraform or manual)
- [ ] Queue client module created (`lib/queue/client.ts`)
- [ ] sendMessage method implemented
- [ ] Message format defined: {analysisId, address, coordinates}
- [ ] Error handling for queue failures
- [ ] Fallback: update analysis status to "failed" if queue submission fails
- [ ] Queue URL configured via environment variable
- [ ] Dead letter queue configured (after 3 retries)

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** Story 3.1

**Technical Notes:**
- Critical for scalability
- Enables horizontal scaling of ML workers
- Provides retry logic automatically

---

## Story 3.3: Results Retrieval Endpoint

**As a** frontend application  
**I want** to retrieve analysis results by ID  
**So that** users can see their measurements

**API Endpoint:** `GET /api/results/[id]`

**Acceptance Criteria:**
- [ ] API route created (`app/api/results/[id]/route.ts`)
- [ ] Check Redis cache first (cache-first strategy)
- [ ] Query database if not in cache
- [ ] Return 404 if analysis not found
- [ ] Include measurements and photos in response
- [ ] Cache completed analyses with 1-hour TTL
- [ ] No caching for in-progress analyses
- [ ] DO NOT cache analyses with status 'queued' or 'processing'
- [ ] Cache-Control header: no-cache for in-progress analyses
- [ ] CORS headers configured for same-origin

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** Story 1.3, Story 3.1

**Response:**
```json
{
  "id": "uuid",
  "status": "completed",
  "confidence": 87.5,
  "address": "1234 Main St, Austin, TX 78701",
  "measurements": {
    "totalArea": 2456.8,
    "perimeter": 198.5,
    "pitch": "6/12",
    "slope": 26.5,
    "complexity": 6,
    "vents": 3,
    "chimneys": 1,
    "skylights": 0,
    "dormers": 1,
    "satelliteDishes": 0,
    "satelliteImageUrl": "https://...",
    "annotatedImageUrl": "https://..."
  },
  "createdAt": "2025-11-13T10:30:00Z",
  "completedAt": "2025-11-13T10:33:00Z"
}
```

---

## Story 3.4: Photo Upload Endpoint

**As a** frontend application  
**I want** to upload supplementary photos for enhanced analysis  
**So that** obstructed roofs can still be measured accurately

**API Endpoint:** `POST /api/assist/upload`

**Acceptance Criteria:**
- [ ] API route created (`app/api/assist/upload/route.ts`)
- [ ] Accept multipart/form-data with 3 photos
- [ ] Validate file types (JPEG/PNG only)
- [ ] Validate file sizes (max 10MB each)
- [ ] Upload photos to S3 or Vercel Blob storage
- [ ] Create photo records in database
- [ ] Submit enhanced analysis job to queue
- [ ] Return 200 on success
- [ ] Error handling for upload failures

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 3.2

**Request:**
- multipart/form-data
- Fields: analysisId, photo0, photo1, photo2

**Response:**
```json
{
  "success": true,
  "message": "Photos uploaded, enhanced analysis queued"
}
```

---

## Story 3.5: Health Check Endpoint

**As a** DevOps engineer  
**I want** a health check endpoint  
**So that** I can monitor system status

**API Endpoint:** `GET /api/health`

**Acceptance Criteria:**
- [ ] API route created (`app/api/health/route.ts`)
- [ ] Check database connectivity
- [ ] Check Redis connectivity
- [ ] Check SQS queue availability
- [ ] Return 200 if all healthy
- [ ] Return 503 if any service unhealthy
- [ ] Include service status details
- [ ] Response time <100ms

**Priority:** P1  
**Estimated Effort:** 1 hour  
**Dependencies:** Story 1.2, Story 1.3, Story 3.2

---
