# Roof Mapping Brownfield Architecture Document

## Introduction
This document captures the current state of the Roof Mapping codebase, including real-world patterns, technical debt, and workarounds. It is intended to enable AI agents and developers to navigate and enhance the system effectively.

### Document Scope
Focused on areas relevant to the approved PRD for “Precision Roof Measurement & Complexity Mapping”, particularly mobile responsiveness, polling/caching behaviors, measurement pipeline, and results export.

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-14 | 1.0 | Initial brownfield analysis | Winston (Architect) |

## Quick Reference — Key Files and Entry Points
- Main entry: `app/page.tsx`
- App Router pages: `app/address/page.tsx`, `app/processing/page.tsx`, `app/results/page.tsx`, `app/mobile-assist/page.tsx`
- UI components: `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/card.tsx`, `components/ui/progress.tsx`
- API routes:
  - Submit: `app/api/analyze/route.ts`
  - Analysis submit/status/results: `app/api/analysis/submit/route.ts` (if used), `app/api/analysis/status/route.ts`, `app/api/analysis/results/route.ts`
  - Results by ID: `app/api/results/[id]/route.ts`
  - Health: `app/api/health/route.ts`
  - PDF export: `app/api/export/pdf/route.ts`
  - Assist upload: `app/api/assist/upload/route.ts`
- Services and pipeline:
  - Analysis service: `src/services/analysisService.ts`
  - PDF service: `src/services/pdfService.ts`
  - ML pipeline (TS): `src/ml/pipeline.ts`
  - Imagery/LiDAR: `src/ml/imagery/sentinel2.ts`, `src/ml/lidar/usgs.ts`
  - Roof detection: `src/ml/models/maskrcnn.ts`
  - Measurement engine: `src/ml/measurements/engine.ts`
- Data & repositories: `prisma/schema.prisma`, `lib/db.ts`, `src/repositories/*`
- Cache & external HTTP:
  - Cache: `lib/cache.ts` (in-memory)
  - Env: `lib/env.ts`
  - Proxy HTTP: `lib/http.ts`
- Queue stub: `src/queues/sqs.ts`
- Lambda (Node): `lambda/handler.js`
- Tests: `tests/*.test.ts`, E2E: `e2e/main.spec.ts`

## High Level Architecture
### Technical Summary
- Next.js 14 App Router provides both UI and API routes.
- Analysis submission triggers a simulated job and measurement pipeline; results are retrieved via API with optional overlay generation and caching.
- Persistence uses Prisma with an in-memory fallback when `DATABASE_URL` is not set.
- Cache layer is an in-memory Map; Redis is not currently implemented in code.
- External integrations are abstracted via `lib/http.ts` when `EXTERNAL_API_URL` is set.

### Actual Tech Stack
| Category | Technology | Version | Notes |
| Runtime | Node.js | (from environment) | ES modules (`type: module`) |
| Framework | Next.js | ^14.2.0 | App Router, serverless-friendly |
| UI | React | ^18.2.0 | Client components for pages |
| Styling | TailwindCSS | ^3.4.4 | `app/globals.css`, `tailwind.config.ts` |
| ORM | Prisma | ^5.17.0 | In-memory fallback via `lib/db.ts` |
| DB | PostgreSQL | (via `DATABASE_URL`) | Optional; not required in local fallback |
| Testing | Vitest | ^1.5.0 | Unit/integration tests |
| E2E | Playwright | ^1.48.0 | End-to-end test `e2e/main.spec.ts` |
| Lint/Format | ESLint/Prettier | ^8.57.0 / ^3.1.1 | Husky pre-commit configured |
| PDF | pdf-lib | ^1.17.1 | Client/server-side PDF utilities |

### Repository Structure Reality Check
- Type: Polyrepo (single project)
- Package Manager: npm (lockfile present)
- Notable realities:
  - ML pipeline implemented in TypeScript with stubbed detection; PRD references Python/Detectron2 on Lambda, which differs from current codebase.
  - Cache is in-memory only; Redis references in PRD are not yet wired.
  - SQS integration is a stub that requires `SQS_QUEUE_URL` to enqueue and otherwise no-ops.

## Source Tree and Module Organization
### Project Structure (Actual)
```text
app/                  # Next.js App Router pages and API routes
components/ui/        # Shadcn-like UI primitives (button, card, input, progress)
lib/                  # env, db (Prisma or in-memory), cache (in-memory), HTTP proxy
prisma/               # Prisma schema
src/ml/               # TS imagery, LiDAR, detection, measurement engine, pipeline
src/repositories/     # Repos for Analysis, Measurements, Photo
src/services/         # Analysis service, PDF service
src/queues/           # SQS stub
lambda/               # Node Lambda handler stub
tests/, e2e/          # Unit/integration and Playwright tests
docs/                 # Architecture and PRD shards, brief
```

### Key Modules and Their Purpose
- Analysis submission and lifecycle: `src/services/analysisService.ts`
- Overlay generation: client-side canvas in `app/results/page.tsx`, SVG in `analysisService.ts`
- Measurement calculation: `src/ml/measurements/engine.ts`
- Detection and selection: `src/ml/models/maskrcnn.ts`
- Imagery and LiDAR fetching: `src/ml/imagery/sentinel2.ts`, `src/ml/lidar/usgs.ts`
- Cache: `lib/cache.ts` (TTL in-memory)
- DB access: `lib/db.ts` (Prisma client or in-memory store)

## Data Models and APIs
### Data Models
- Prisma schema: `prisma/schema.prisma`
  - `Analysis` with `status` enum (PENDING, PROCESSING, COMPLETED, FAILED)
  - `Measurements` linked by `analysisId`, includes `roofAreaSqm`, `perimeterM`, `pitchDeg`, `slopePct`, `confidenceScore`, `pitchConfidencePct`, `pitchEstimated`, `imageryUrl`, `annotatedUrl`
  - `Photo` records for mobile assist images

### API Specifications (Discovered)
- `POST /api/analyze` → `app/api/analyze/route.ts`
  - Body `{ address }`, returns `{ analysisId, status: 'queued' }` (202) 
- `GET /api/analysis/status?id=...` → `app/api/analysis/status/route.ts`
  - Returns `{ status, progress }`; proxies to external API if configured
- `GET /api/analysis/results?id=...` → `app/api/analysis/results/route.ts`
  - Returns analysis + measurements + overlay; proxies if external available
- `GET /api/results/[id]` → `app/api/results/[id]/route.ts`
  - Cache-first for COMPLETED analyses with 1-hour TTL; `no-cache` for in-progress
- `GET /api/health` → `app/api/health/route.ts`
  - Reports DB health and basic status with response time
- `POST /api/assist/upload` → `app/api/assist/upload/route.ts` (present; details TBD)
- `GET /api/export/pdf?id=...` → `app/api/export/pdf/route.ts` (present)

## Technical Debt and Known Issues
### Critical Technical Debt
1. ML pipeline implemented in TypeScript with stubbed detection; PRD specifies Python/Detectron2 Lambda. Requires reconciliation or updated PRD.
2. Cache is in-memory only; lacks Redis integration and persistence. TTL behavior is process-local.
3. SQS queue integration is stubbed; without `SQS_QUEUE_URL`, jobs do not enqueue beyond local simulation.
4. Address input lacks Google Places Autocomplete and validation required by PRD acceptance criteria.
5. Results complexity calculation is simplistic (perimeter-derived); formula and UX indicators need alignment with PRD.

### Workarounds and Gotchas
- Database fallback: When `DATABASE_URL` unset, `lib/db.ts` uses an in-memory store; data is ephemeral.
- External API proxy: When `EXTERNAL_API_URL` set, imagery/status/results proxy through `lib/http.ts` with optional Bearer auth; failures fall back silently.
- Cache invalidation: Manual `cacheDel` in `analysisService.ts` on completion; ensure consistency if external cache added later.
- Health checks: Redis and SQS reported as `unknown`; needs enhancement.

## Integration Points and External Dependencies
### External Services
| Service | Purpose | Integration Type | Key Files |
| Sentinel Hub (or provider) | Satellite imagery | HTTP proxy (optional) | `lib/http.ts`, `src/ml/imagery/sentinel2.ts` |
| USGS 3DEP | LiDAR | Direct HTTP (placeholder TS) | `src/ml/lidar/usgs.ts` |
| Queue (SQS) | Async processing | Stubbed enqueue | `src/queues/sqs.ts` |

### Internal Integration Points
- Frontend ↔ API routes: App Router endpoints under `app/api/*`
- Pipeline ↔ Measurements: `src/ml/pipeline.ts` → `src/ml/measurements/engine.ts`
- Overlay visualization: `<canvas>` overlay drawing tied to `overlay.polygons`

## Development and Deployment
### Local Development Setup
- Start dev server: `npm run dev`
- Build: `npm run build`; Start: `npm start`
- Formatting/linting: `npm run format`, `npm run lint`
- Husky pre-commit hooks: `.husky/pre-commit`
- Environment variables: `lib/env.ts`(reads `DATABASE_URL`, `REDIS_URL`, `SQS_QUEUE_URL`, `EXTERNAL_API_URL`, `EXTERNAL_API_KEY`)

### Build and Deployment Process
- Next.js build pipeline; GitHub Actions workflows present under `.github/workflows/`
- Lambda handler exists (`lambda/handler.js`), but ML pipeline is TS; deployment strategy needs alignment.

## Testing Reality
- Unit/Integration: Vitest tests under `tests/`
- E2E: Playwright spec `e2e/main.spec.ts`
- Coverage metrics not enforced; CI config present

## Enhancement Impact Analysis (per PRD)
### Files Likely to Need Modification
- `app/address/page.tsx` — add Google Places Autocomplete and validation
- `app/processing/page.tsx` — verify polling delays, intervals, stop-on-navigation, long-wait and timeout flows match ACs
- `app/results/page.tsx` — full measurements display, accuracy indicators, feature counts, share/export UX; responsive grid
- `app/api/results/[id]/route.ts` & `app/api/analysis/results/route.ts` — enforce cache-first logic, no-cache headers for in-progress statuses
- `src/ml/measurements/engine.ts` — implement feature detection and robust complexity score formula; confidence handling per LiDAR availability
- `src/ml/models/maskrcnn.ts` — replace stub with actual detector integration
- `lib/cache.ts` — replace in-memory cache with Redis client; TTL, invalidation, error handling
- `src/queues/sqs.ts` — replace stub with AWS SDK client, DLQ configuration

### New Files/Modules Needed
- Redis client wrapper (Upstash/ElastiCache) and cache service
- Google Places client and `AddressInput` component with accessibility
- PDF generator utility aligning brand guidelines and size constraints
- OpenAPI spec under `docs/api/openapi.yaml` for analyze/results endpoints

### Integration Considerations
- Maintain existing response shapes for UI compatibility
- Ensure cache exclusion for `PENDING`/`PROCESSING` statuses
- Align confidence thresholds with assist routing (70%) and pitch confidence UI

## Appendix — Useful Commands and Scripts
- Dev: `npm run dev`
- Build: `npm run build`
- Test: `npm test`
- E2E: `npm run e2e`
- Prisma: `npm run prisma:generate`, `npm run prisma:format`, `npm run prisma:studio`

---
This brownfield architecture document reflects the actual system state, highlighting divergences from the PRD where relevant and identifying concrete impact areas for upcoming work.
