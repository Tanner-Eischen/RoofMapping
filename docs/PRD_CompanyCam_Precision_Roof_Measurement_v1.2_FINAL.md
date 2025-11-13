# Precision Roof Measurement & Complexity Mapping

**Organization:** CompanyCam  
**Project ID:** ad0w8tJrc0PZKTA34A2Y_1762020579094  
**Version:** 1.2 (PO Validated & Enhanced)  
**Last Updated:** November 13, 2025

---

# Product Requirements Document (PRD)

## 1. Executive Summary
The "Precision Roof Measurement & Complexity Mapping" solution is an AI-driven tool designed to empower contractors by providing accurate, fast, and actionable roof measurements and structure insights. Developed by CompanyCam, this mobile-first solution leverages satellite imagery, public LiDAR, parcel data, and guided smartphone capture to deliver results in under five minutes. By eliminating reliance on expensive third-party vendors and ensuring usability in less-than-ideal conditions, this tool enhances contractors' ability to build bids, coordinate crews, and engage customers confidently.

## 2. Problem Statement
Contractors urgently need reliable and precise roof measurements to improve efficiency in proposals and project management. Current tools are often costly, dependent on external vendors, or ineffective in challenging capture conditions such as overhanging trees or remote locations. A cost-effective, mobile, and user-friendly alternative is needed to address these limitations and meet the demands of tight timelines.

## 3. Goals & Success Metrics
- **Accuracy**: Achieve measurement precision within ±3%.
- **Speed**: Deliver results in under 5 minutes.
- **User Adoption**: High adoption rate among target users within the first 6 months.
- **Integration**: Seamless exportability to third-party estimating and insurance tools.
- **Cost Efficiency**: Achieve ~$0.06 per analysis vs competitors' $25-75.

## 4. Target Users & Personas
- **General Contractors**: Need accurate measurements for bidding and project planning.
- **Roofing Specialists**: Require detailed insights on roof complexities for installations and repairs.
- **Insurance Adjusters**: Utilize precise data for claims assessments.
- **Sales Teams**: Leverage actionable insights to enhance customer interactions.

## 5. User Stories
- **As a contractor, I want to quickly measure roofs with high precision so that I can prepare accurate bids and schedule crews efficiently.**
- **As a roofing specialist, I want to identify roof features like vents and chimneys so that I can plan installations without surprises.**
- **As an insurance adjuster, I want to export roof data to integrate with my assessment tools for streamlined claims processing.**

## 6. Functional Requirements
### P0: Must-have
- **High Precision Measurement**: Detect and measure roof edges, pitch, slope, and square footage.
- **Feature Identification**: Automatically detect vents, chimneys, dormers, skylights, and satellite dishes.
- **Mobile-Assisted Capture**: Guide users in capturing supplementary photos to enhance satellite data.
- **Result Exportability**: Provide shareable links, PDFs, and JSON exports.
- **Async Processing**: Queue-based ML processing with polling for results.
- **Caching**: Fast results retrieval for completed analyses.

### P1: Should-have
- **Obstruction Handling**: Accurately process data with partial obstructions like trees or shadows.
- **AR-Guided Annotations**: Support augmented reality features for detailed annotations and measurements.

### P2: Nice-to-have
- **Additional Integrations**: Expand export options to include more third-party tools.
- **Enhanced User Interface**: Develop advanced visualization features for roof complexity mapping.

## 7. Non-Functional Requirements
- **Performance**: 
  - Page load (LCP): <2.5s
  - API response: <200ms
  - ML processing: <5 minutes
  - Concurrent users: 100+
- **Security**: Ensure data privacy and integrity, compliant with industry standards.
- **Scalability**: Capable of handling increased user load without performance degradation.
- **Reliability**: 99.5% uptime, graceful degradation when services unavailable.

## 8. User Experience & Design Considerations
- **Intuitive UI/UX**: Ensure ease of use with clear instructions and feedback.
- **Accessibility**: Design for inclusivity, adhering to WCAG 2.1 Level AA standards.
- **Mobile-First Design**: Optimize for smartphone use with responsive design principles.
- **Progressive Disclosure**: Show only what's needed at each step.
- **Immediate Feedback**: Every action gets instant response.

## 9. Technical Requirements
- **System Architecture**: Hybrid serverless architecture with Next.js + AWS Lambda.
- **Frontend**: Next.js 14 + React 18 + shadcn/ui + Tailwind CSS.
- **Backend**: Next.js API Routes + Python ML Services.
- **Database**: PostgreSQL with Prisma ORM.
- **Cache**: Redis for results caching.
- **Queue**: AWS SQS for async ML processing.
- **ML Pipeline**: AWS Lambda with Mask R-CNN (Detectron2).
- **Storage**: AWS S3 for images and generated PDFs.
- **Integrations**: Sentinel Hub (satellite), USGS 3DEP (LiDAR), Google Maps (geocoding).
- **Deployment**: Vercel (frontend/API), AWS (ML services).

## 10. Dependencies & Assumptions
- **Satellite Imagery Availability**: Assumes consistent access to Sentinel-2 satellite data (10m resolution).
- **LiDAR Data**: Assumes availability of USGS 3DEP LiDAR datasets (10cm vertical accuracy).
- **Smartphone Capabilities**: Assumes user devices have necessary sensors for enhanced capture.
- **Internet Connectivity**: Requires stable internet for satellite/LiDAR data fetching.
- **AWS Services**: Assumes access to AWS Lambda, SQS, and S3.

## 11. Out of Scope
- **Custom Integrations for Individual Clients**: This version focuses on general exportability, not custom solutions.
- **Extended AR Features Beyond Annotation**: Advanced AR capabilities beyond essential annotations are not included.
- **User Authentication**: MVP will be public (no login required).
- **Payment Processing**: No billing system in MVP.
- **Real-time Collaboration**: Future enhancement.

---

## 12. Epic and Story Structure

### Epic 1: Foundation & Infrastructure Setup

**Epic Goal:** Establish the foundational infrastructure for the fullstack application, including database, caching, and deployment pipelines.

**Epic Priority:** P0 (Must-have for MVP)

---

#### Story 1.1: Project Initialization & Configuration

**As a** developer  
**I want** to initialize the Next.js project with all necessary configurations  
**So that** the team has a consistent development environment

**Acceptance Criteria:**
- [ ] Next.js 14 project created with TypeScript
- [ ] shadcn/ui initialized and configured
- [ ] Tailwind CSS configured with design tokens from UX spec
- [ ] ESLint and Prettier configured
- [ ] Husky pre-commit hooks set up
- [ ] Git repository initialized with proper .gitignore
- [ ] README with local setup instructions

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** None

---

#### Story 1.2: Database Setup with Prisma

**As a** developer  
**I want** to set up PostgreSQL with Prisma ORM  
**So that** we can persist analysis results and measurements

**Acceptance Criteria:**
- [ ] Prisma schema defined (Analysis, Measurements, Photo models)
- [ ] PostgreSQL database created (local + staging)
- [ ] Prisma client configured
- [ ] Initial migration created and applied
- [ ] Database connection working in API routes
- [ ] Repository pattern implemented for data access

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 1.1

**Technical Notes:**
- Use schema from architecture document
- Include indexes on status, createdAt, analysisId
- Connection pooling configured (10 connections)

---

#### Story 1.3: Redis Caching Layer

**As a** developer  
**I want** to implement Redis caching for analysis results  
**So that** we can serve completed results quickly when users poll

**Acceptance Criteria:**
- [ ] Redis client configured (Upstash or local)
- [ ] Cache service module created with get/set/del methods
- [ ] Completed analyses cached with 1-hour TTL
- [ ] Cache-first strategy implemented in results endpoint
- [ ] Cache invalidation on analysis updates
- [ ] Error handling when Redis unavailable

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** Story 1.2

**Technical Notes:**
- Critical for results polling performance
- Reduces database load by 70-80%
- Use cache key format: `analysis:${id}`

---

#### Story 1.4: Environment Configuration

**As a** developer  
**I want** to configure environment variables and secrets  
**So that** API keys and credentials are managed securely

**Acceptance Criteria:**
- [ ] .env.example created with all required variables
- [ ] .env.local template provided for team
- [ ] Vercel environment variables configured (preview + production)
- [ ] AWS credentials configured for Lambda access
- [ ] Google Maps API key configured
- [ ] Sentinel Hub credentials configured
- [ ] Database URLs configured per environment

**Priority:** P0  
**Estimated Effort:** 1 hour  
**Dependencies:** Story 1.1

---

### Epic 2: Frontend Implementation

**Epic Goal:** Build the mobile-first web application with all four screens per UX specification.

**Epic Priority:** P0 (Must-have for MVP)

---

#### Story 2.1: Address Input Screen (Screen 1)

**As a** contractor  
**I want** to enter a property address with autocomplete  
**So that** I can quickly start a roof analysis

**Acceptance Criteria:**
- [ ] Address input page implemented (`app/page.tsx`)
- [ ] Google Maps Places Autocomplete integrated
- [ ] Input validation (must select from autocomplete)
- [ ] Error states displayed for invalid addresses
- [ ] "Analyze Roof" button enabled only when valid address selected
- [ ] Navigation to processing screen on submission
- [ ] Mobile-responsive (matches UX spec exactly)
- [ ] Accessibility: ARIA labels, keyboard navigation

**Priority:** P0  
**Estimated Effort:** 4 hours  
**Dependencies:** Story 1.1, Story 1.4

**UI Components:**
- AddressInput component
- PlaceAutocomplete component  
- Button, Input, Card from shadcn/ui

---

#### Story 2.2: Processing Screen (Screen 2)

**As a** contractor  
**I want** to see a loading state while my analysis processes  
**So that** I know the system is working

**Acceptance Criteria:**
- [ ] Processing page implemented (`app/analyze/page.tsx`)
- [ ] Spinning loader with sage green color
- [ ] Display submitted address
- [ ] Status text: "Analyzing Roof" and "Processing satellite and LiDAR data..."
- [ ] Automatic navigation from Screen 1
- [ ] Poll for results every 2 seconds (starts after 2 seconds)
- [ ] Poll starts 2 seconds after page load (not immediately)
- [ ] Poll interval: exactly 2 seconds between requests
- [ ] Stop polling on navigation away from page
- [ ] Show 'Taking longer than expected' message after 30s
- [ ] Navigate to results when status = "completed"
- [ ] Navigate to mobile assist when status = "needs_assist"
- [ ] Timeout after 30s: show retry button
- [ ] Timeout after 60s: redirect to mobile assist

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 2.1

---

#### Story 2.3: Results Screen (Screen 3a)

**As a** contractor  
**I want** to view detailed roof measurements and export them  
**So that** I can use the data for my bids

**Acceptance Criteria:**
- [ ] Results page implemented (`app/results/page.tsx`)
- [ ] Display all measurements from API (area, perimeter, pitch, slope)
- [ ] Complexity indicator with progress bar
- [ ] Feature count display (vents, chimneys, etc.)
- [ ] Accuracy indicators (±3% notation)
- [ ] Satellite image display
- [ ] Share button with native share API (mobile) or copy link (desktop)
- [ ] Export PDF button (client-side generation)
- [ ] Mobile-responsive grid layout
- [ ] Loading states for images
- [ ] Error handling for missing analysis

**Priority:** P0  
**Estimated Effort:** 5 hours  
**Dependencies:** Story 2.2

**UI Components:**
- MeasurementCard component
- ComplexityIndicator component
- Results header with actions

---

#### Story 2.4: Mobile Assist Screen (Screen 3b)

**As a** contractor  
**I want** to capture supplementary photos when satellite data is insufficient  
**So that** I can still get accurate measurements

**Acceptance Criteria:**
- [ ] Mobile assist page implemented (`app/assist/page.tsx`)
- [ ] Explanation of why photos needed (low confidence)
- [ ] Three photo guides: front, left side, right side
- [ ] Camera modal with guidance overlay
- [ ] Photo preview after capture
- [ ] Re-take functionality
- [ ] Submit button enabled when all 3 photos captured
- [ ] Loading state during photo upload
- [ ] Navigate to results after enhanced processing
- [ ] Image compression before upload (max 1920px, 85% quality)

**Priority:** P0  
**Estimated Effort:** 6 hours  
**Dependencies:** Story 2.3

**UI Components:**
- PhotoGuideCard component
- CameraModal component (react-webcam)
- Photo thumbnail grid

---

#### Story 2.5: PDF Export Functionality

**As a** contractor  
**I want** to export measurements as a PDF  
**So that** I can share with clients and save for records

**Acceptance Criteria:**
- [ ] PDF generation implemented (jsPDF + html2canvas)
- [ ] PDF includes: address, date, all measurements, satellite image
- [ ] Professional formatting matching brand guidelines
- [ ] Generated filename: "RoofReport_[Address]_[Date].pdf"
- [ ] Download triggered on button click
- [ ] Loading indicator during generation
- [ ] Works on mobile devices
- [ ] PDF size optimized (<5MB)

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 2.3

**Technical Notes:**
- Client-side generation (no server processing)
- Lazy load jsPDF and html2canvas
- Use pdf-generator.ts utility

---

### Epic 3: Backend API Implementation

**Epic Goal:** Build the REST API endpoints for analysis submission, results retrieval, and photo uploads.

**Epic Priority:** P0 (Must-have for MVP)

---

#### Story 3.1: Analysis Submission Endpoint

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

#### Story 3.2: SQS Queue Integration

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

#### Story 3.3: Results Retrieval Endpoint

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

#### Story 3.4: Photo Upload Endpoint

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

#### Story 3.5: Health Check Endpoint

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

### Epic 4: ML Processing Pipeline

**Epic Goal:** Implement the Python-based ML service that analyzes satellite imagery and LiDAR data to produce roof measurements.

**Epic Priority:** P0 (Must-have for MVP)

---

#### Story 4.1: Lambda Handler & Service Architecture

**As a** backend system  
**I want** a Lambda function that processes analysis requests  
**So that** I can generate roof measurements from satellite data

**Acceptance Criteria:**
- [ ] Lambda handler created (`ml-service/handler.py`)
- [ ] SQS event parsing implemented
- [ ] Error handling with logging to CloudWatch
- [ ] Service architecture set up (measurement_service.py)
- [ ] Docker container configured for Lambda
- [ ] requirements.txt with all dependencies
- [ ] Dockerfile for Lambda deployment
- [ ] Environment variables configured (AWS credentials, API keys)

**Priority:** P0  
**Estimated Effort:** 4 hours  
**Dependencies:** Story 3.2

**Technical Notes:**
- Lambda timeout: 15 minutes (max)
- Memory: 3GB (CPU-optimized)
- Runtime: Python 3.11
- Cold start: ~2-5 seconds

---

#### Story 4.2: Sentinel-2 Satellite Imagery Integration

**As an** ML service  
**I want** to fetch Sentinel-2 satellite imagery for a property location  
**So that** I can detect roof boundaries

**Acceptance Criteria:**
- [ ] Sentinel client created (`ml-service/services/sentinel_client.py`)
- [ ] OAuth authentication with Sentinel Hub implemented
- [ ] Fetch imagery method with bbox calculation
- [ ] Filter for <20% cloud coverage
- [ ] RGB bands (B04, B03, B02) extraction
- [ ] Image resolution: 512x512 pixels
- [ ] Retry logic for API failures
- [ ] Error handling for no imagery available

**Priority:** P0  
**Estimated Effort:** 4 hours  
**Dependencies:** Story 4.1

**Technical Notes:**
- Uses Sentinel Hub Process API
- Free tier: 30,000 processing units/month
- 10m resolution sufficient for roof detection

---

#### Story 4.3: USGS LiDAR Data Integration

**As an** ML service  
**I want** to fetch USGS 3DEP LiDAR elevation data  
**So that** I can calculate roof pitch and slope

**Acceptance Criteria:**
- [ ] USGS client created (`ml-service/services/usgs_client.py`)
- [ ] Elevation query implemented via USGS API
- [ ] Point cloud data fetching (if available)
- [ ] Coordinate transformation for accuracy
- [ ] Error handling for unavailable LiDAR data
- [ ] Fallback: pitch calculation from satellite imagery only
- [ ] Data quality validation

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 4.1

**Technical Notes:**
- USGS 3DEP provides 10cm vertical accuracy
- Not available everywhere - fallback required
- Public API, no authentication needed

---

#### Story 4.4: Mask R-CNN Roof Detection

**As an** ML service  
**I want** to detect roof boundaries using Mask R-CNN  
**So that** I can extract roof polygons for measurement

**Acceptance Criteria:**
- [ ] Roof detector created (`ml-service/models/roof_detector.py`)
- [ ] Detectron2 Mask R-CNN initialized with pretrained weights
- [ ] Inference method implemented (input: image, output: detections)
- [ ] Mask-to-polygon conversion implemented
- [ ] Confidence score calculation
- [ ] Handle multiple detections (select largest)
- [ ] Model confidence threshold: 0.7
- [ ] Error handling for no detections

**Priority:** P0  
**Estimated Effort:** 5 hours  
**Dependencies:** Story 4.2

**Technical Notes:**
- Use COCO-pretrained model for MVP
- Fine-tuned roof model for production (future)
- CPU inference (~5-10 seconds)
- Expected accuracy: 85-95%

---

#### Story 4.5: Measurement Calculation Engine

**As an** ML service  
**I want** to calculate roof measurements from detected polygons and LiDAR  
**So that** I can provide accurate area, perimeter, pitch, and slope

**Acceptance Criteria:**
- [ ] Measurement calculation implemented in measurement_service.py
- [ ] Area calculation (pixels to square feet conversion)
- [ ] Perimeter calculation (pixels to feet conversion)
- [ ] Pitch calculation from LiDAR elevation data
- [ ] Slope percentage calculation
- [ ] Feature detection (vents, chimneys, etc.) - basic implementation
- [ ] Complexity score calculation (1-10 scale)
- [ ] Confidence score calculation based on multiple factors
- [ ] Accuracy validation: ±3% target
- [ ] Calculate pitch confidence score (0-100%)
- [ ] Flag low-confidence pitch when LiDAR unavailable
- [ ] Add 'Estimated' tag to pitch measurements without LiDAR

**Priority:** P0  
**Estimated Effort:** 4 hours  
**Dependencies:** Story 4.3, Story 4.4

**Technical Notes:**
- Resolution conversion: 10m Sentinel-2 pixels
- 1 square meter = 10.764 square feet
- Pitch notation: flat, low (4/12), medium (6/12), steep (9/12)

---

#### Story 4.6: Lambda Deployment Pipeline

**As a** DevOps engineer  
**I want** a CI/CD pipeline for Lambda function deployment  
**So that** ML service updates are automated

**Acceptance Criteria:**
- [ ] Dockerfile builds successfully
- [ ] Docker image pushed to AWS ECR
- [ ] Lambda function created/updated via AWS CLI
- [ ] GitHub Actions workflow for deployment
- [ ] Deployment triggered on merge to main
- [ ] Environment variables configured in Lambda
- [ ] CloudWatch logging configured
- [ ] Lambda function versioning enabled

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 4.1

**Technical Notes:**
- Use ECR for container registry
- Lambda layers for large dependencies (future optimization)
- Function URL enabled for testing

---

#### Story 4.7: Database Result Storage

**As an** ML service  
**I want** to store analysis results in the database  
**So that** the frontend can retrieve measurements

**Acceptance Criteria:**
- [ ] Database update logic in Lambda
- [ ] Update analysis status to "processing" when started
- [ ] Create measurements record with all calculated values
- [ ] Upload annotated images to S3
- [ ] Store S3 URLs in measurements
- [ ] Update analysis status to "completed" on success
- [ ] Update status to "needs_assist" if confidence <70%
- [ ] Update status to "failed" on errors
- [ ] Set completedAt timestamp

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** Story 4.5

---

### Epic 5: Testing & Quality Assurance

**Epic Goal:** Ensure the application is reliable, performant, and meets acceptance criteria through comprehensive testing.

**Epic Priority:** P0 (Must-have for MVP)

---

#### Story 5.1: Unit Tests for Frontend Components

**As a** developer  
**I want** unit tests for React components  
**So that** component behavior is validated

**Acceptance Criteria:**
- [ ] Jest and React Testing Library configured
- [ ] Tests for AddressInput component
- [ ] Tests for MeasurementCard component
- [ ] Tests for CameraModal component
- [ ] Tests for API service functions
- [ ] Code coverage >70% for components
- [ ] All tests passing in CI pipeline

**Priority:** P1  
**Estimated Effort:** 4 hours  
**Dependencies:** Epic 2

---

#### Story 5.2: Integration Tests for API Routes

**As a** developer  
**I want** integration tests for API endpoints  
**So that** backend functionality is validated

**Acceptance Criteria:**
- [ ] Supertest or similar configured
- [ ] Test: POST /api/analyze creates analysis
- [ ] Test: GET /api/results/[id] retrieves analysis
- [ ] Test: POST /api/assist/upload handles photos
- [ ] Test: Error cases (400, 404, 500)
- [ ] Database transactions rolled back after tests
- [ ] All tests passing in CI pipeline

**Priority:** P1  
**Estimated Effort:** 3 hours  
**Dependencies:** Epic 3

---

#### Story 5.3: E2E Tests for User Flows

**As a** QA engineer  
**I want** end-to-end tests for critical user flows  
**So that** the complete user experience is validated

**Acceptance Criteria:**
- [ ] Playwright configured
- [ ] Test: Success path (address → results)
- [ ] Test: Mobile assist path (photos → enhanced results)
- [ ] Test: PDF export
- [ ] Test: Share functionality
- [ ] Test: Error handling (invalid address, timeout)
- [ ] Test: Invalid address submission shows error "Please enter a valid address"
- [ ] Test: Network failure during polling shows retry button
- [ ] Test: Mobile assist triggered when confidence <70%
- [ ] Test: PDF download works with special characters in address
- [ ] Tests run in CI on preview deployments

**Priority:** P1  
**Estimated Effort:** 5 hours  
**Dependencies:** Epic 2, Epic 3

---

#### Story 5.4: ML Pipeline Testing

**As a** developer  
**I want** tests for the ML processing pipeline  
**So that** measurement accuracy is validated

**Acceptance Criteria:**
- [ ] Pytest configured for Python code
- [ ] Test: Sentinel client with mocked API
- [ ] Test: USGS client with mocked API
- [ ] Test: Roof detection with sample images
- [ ] Test: Measurement calculations with known roofs
- [ ] Test: Accuracy validation (±3% target)
- [ ] Mock external API calls to avoid rate limits

**Priority:** P1  
**Estimated Effort:** 4 hours  
**Dependencies:** Epic 4

---

#### Story 5.5: Performance Testing

**As a** DevOps engineer  
**I want** to validate system performance under load  
**So that** we meet our performance targets

**Acceptance Criteria:**
- [ ] Load testing script created (k6 or similar)
- [ ] Test: 100 concurrent users submitting analyses
- [ ] Test: API response times <200ms (p95)
- [ ] Test: ML processing <5 minutes (p95)
- [ ] Test: Database connection pool under load
- [ ] Test: Redis cache effectiveness
- [ ] Performance report generated

**Priority:** P1  
**Estimated Effort:** 3 hours  
**Dependencies:** Epic 2, Epic 3, Epic 4

---

### Epic 6: Deployment & Operations

**Epic Goal:** Deploy the application to production and establish operational procedures.

**Epic Priority:** P0 (Must-have for MVP)

---

#### Story 6.1: Vercel Production Deployment

**As a** DevOps engineer  
**I want** to deploy the Next.js application to Vercel  
**So that** users can access the application

**Acceptance Criteria:**
- [ ] Vercel project created and linked to GitHub
- [ ] Environment variables configured in Vercel
- [ ] Production deployment successful
- [ ] Custom domain configured (optional for MVP)
- [ ] SSL/TLS certificate active
- [ ] Deployment previews enabled for PRs
- [ ] Automatic deployments on main branch

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** Epic 2, Epic 3

---

#### Story 6.2: AWS Infrastructure Setup

**As a** DevOps engineer  
**I want** to provision AWS resources for ML processing  
**So that** the Lambda pipeline can run

**Acceptance Criteria:**
- [ ] AWS account and IAM user configured
- [ ] SQS queue created
- [ ] Lambda function deployed
- [ ] ECR repository for Docker images
- [ ] S3 bucket for image storage
- [ ] CloudWatch logs configured
- [ ] IAM policies configured (least privilege)
- [ ] Dead letter queue configured

**Priority:** P0  
**Estimated Effort:** 3 hours  
**Dependencies:** Story 4.6

---

#### Story 6.3: Database Production Setup

**As a** DevOps engineer  
**I want** to provision a production PostgreSQL database  
**So that** we can persist data reliably

**Acceptance Criteria:**
- [ ] PostgreSQL database provisioned (Heroku or AWS RDS)
- [ ] Database credentials stored securely
- [ ] SSL connection enabled
- [ ] Automated backups configured (daily)
- [ ] Connection pooling configured
- [ ] Prisma migrations applied to production
- [ ] Database monitoring enabled

**Priority:** P0  
**Estimated Effort:** 2 hours  
**Dependencies:** Story 1.2

---

#### Story 6.4: Redis Cache Production Setup

**As a** DevOps engineer  
**I want** to provision a production Redis instance  
**So that** we can cache analysis results

**Acceptance Criteria:**
- [ ] Redis instance provisioned (Upstash or AWS ElastiCache)
- [ ] Redis connection string configured in Vercel
- [ ] SSL connection enabled
- [ ] Persistence configured
- [ ] Memory limit configured (1GB for MVP)
- [ ] Monitoring enabled

**Priority:** P0  
**Estimated Effort:** 1 hour  
**Dependencies:** Story 1.3

---

#### Story 6.5: Monitoring & Alerting

**As a** DevOps engineer  
**I want** to set up monitoring and alerting  
**So that** I'm notified of system issues

**Acceptance Criteria:**
- [ ] CloudWatch dashboard created for Lambda metrics
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring configured (UptimeRobot or similar)
- [ ] Alerts configured for:
  - API 5xx error rate >5% over 5-minute window
  - Lambda timeout rate >10% of executions
  - Average ML processing time >7 minutes (p95)
  - Redis cache hit rate <70% over 15 minutes
  - Database connection failures
  - SQS dead letter queue messages
- [ ] Slack webhook for alerts (optional)
- [ ] Weekly performance reports

**Priority:** P1  
**Estimated Effort:** 2 hours  
**Dependencies:** Epic 6 (Stories 6.1-6.4)

---

#### Story 6.6: Documentation & Runbook

**As a** team member  
**I want** comprehensive documentation  
**So that** I can understand and maintain the system

**Acceptance Criteria:**
- [ ] README updated with architecture overview
- [ ] Local development setup documented
- [ ] Deployment procedures documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide created
- [ ] Runbook for common incidents:
  - Lambda timeout errors
  - Database connection issues
  - SQS queue backlog
  - Sentinel/USGS API failures
- [ ] API documentation (OpenAPI spec)

**Priority:** P1  
**Estimated Effort:** 3 hours  
**Dependencies:** Epic 6

---

## 13. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Nov 12, 2025 | Initial PRD | Product Team |
| 1.1 | Nov 13, 2025 | Added Epic/Story structure aligned with architecture | Winston (Architect) |
| 1.2 | Nov 13, 2025 | PO validation enhancements - added detailed ACs to Stories 2.2, 3.3, 4.5, 5.3, 6.5 | Sarah (PO) |

---

## 14. Change Summary (v1.1)

### New Stories Added

1. **Story 1.3: Redis Caching Layer** - Critical for results polling performance and database load reduction
2. **Story 3.2: SQS Queue Integration** - Decouples web tier from ML processing, enables horizontal scaling
3. **Story 4.6: Lambda Deployment Pipeline** - Automates ML service deployments via CI/CD

### Story Refinements

1. **Story 3.1: Analysis Submission Endpoint** - Now explicitly separate from queue integration
2. **Epic 4 Stories** - Added separate stories for Sentinel and USGS clients (previously combined)
3. **Story 4.7: Database Result Storage** - New story for Lambda to update database (previously implicit)

### Enhanced Requirements

- Added specific performance metrics (LCP, API response times)
- Added caching requirements (Redis with 1-hour TTL)
- Added queue requirements (SQS with dead letter queue)
- Added infrastructure requirements (Lambda memory, timeout)
- Added CI/CD requirements (GitHub Actions deployment)

---

## 15. Change Summary (v1.2 - PO Validation)

### Story Enhancements from PO Validation

Following comprehensive PO validation (94% completeness score), the following acceptance criteria were added to improve clarity and ensure successful implementation:

**Story 2.2 (Processing Screen) - Enhanced Polling Behavior:**
- Added 4 specific polling acceptance criteria:
  - Poll starts 2 seconds after page load (not immediately)
  - Poll interval: exactly 2 seconds between requests
  - Stop polling on navigation away from page
  - Show 'Taking longer than expected' message after 30s

**Story 3.3 (Results Endpoint) - Enhanced Cache Behavior:**
- Added 2 cache behavior criteria:
  - DO NOT cache analyses with status 'queued' or 'processing'
  - Cache-Control header: no-cache for in-progress analyses

**Story 4.5 (Measurement Engine) - LiDAR Confidence Handling:**
- Added 3 criteria for LiDAR unavailability:
  - Calculate pitch confidence score (0-100%)
  - Flag low-confidence pitch when LiDAR unavailable
  - Add 'Estimated' tag to pitch measurements without LiDAR

**Story 5.3 (E2E Tests) - Specific Test Scenarios:**
- Added 4 explicit test scenarios:
  - Test: Invalid address submission shows error message
  - Test: Network failure during polling shows retry button
  - Test: Mobile assist triggered when confidence <70%
  - Test: PDF download works with special characters in address

**Story 6.5 (Monitoring) - Specific Alert Thresholds:**
- Enhanced alerts with precise thresholds and time windows:
  - API 5xx error rate >5% over 5-minute window
  - Lambda timeout rate >10% of executions
  - Average ML processing time >7 minutes (p95)
  - Redis cache hit rate <70% over 15 minutes

### Validation Results

- **Overall Completeness:** 94% (Excellent)
- **MVP Scope:** Well-defined and realistic
- **Architecture Alignment:** 98%
- **Epic/Story Structure:** 92%
- **Technical Readiness:** 97%
- **Status:** ✅ APPROVED FOR DEVELOPMENT

---

## Approval & Sign-Off

**PRD Review:**
- [x] Product team approved
- [x] Architecture alignment validated (Winston)
- [x] Technical feasibility confirmed
- [x] Epic/story structure approved
- [x] PO validation completed (Sarah - 94% score)
- [ ] Product team approved
- [ ] Architecture alignment validated
- [ ] Technical feasibility confirmed
- [ ] Epic/story structure approved

**Next Steps:**
1. ✅ **PO Validation:** Completed with 94% score - APPROVED
2. **Story Sharding:** Shard this PRD for development (in IDE)
3. **Story Creation:** SM agent creates first story (1.1)
4. **Development Begins:** Dev agent implements Story 1.1

---

**Questions or Feedback?**  
Contact: product@companycam.dev
