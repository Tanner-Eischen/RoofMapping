# Project Brief: CompanyCam Precision Roof Measurement & Complexity Mapping

## Introduction
This brief synthesizes the approved PRD into an actionable overview for planning and execution. It captures goals, problem framing, proposed solution, MVP scope, success metrics, risks, and next steps aligned with current epics and acceptance criteria, with emphasis on mobile responsiveness, polling behavior, and cache strategy.

## Executive Summary
- Mobile-first, AI-driven tool that delivers precise roof measurements and structure insights in under 5 minutes with ±3% accuracy.
- Replaces reliance on expensive third-party vendors through satellite imagery, public LiDAR, and guided smartphone capture.
- Integrates seamlessly with estimating and insurance tools, targeting cost efficiency at approximately $0.06 per analysis.

## Problem Statement
- Contractors need reliable, fast, and precise roof measurements for bids, planning, and customer engagement.
- Existing solutions are expensive ($25–$75 per analysis), vendor-dependent, and struggle under obstructions (trees, shadows) and remote locations.
- A cost-effective, mobile-first alternative is required that performs well in less-than-ideal capture conditions and provides actionable outputs quickly.

## Proposed Solution
- Frontend: Next.js 14 + React 18 with shadcn/ui and Tailwind CSS for a mobile-first, accessible UI.
- Backend: Next.js API routes for web tier; Python ML service on AWS Lambda for analysis.
- Data & Infra: PostgreSQL (Prisma), Redis cache, AWS SQS queue, S3 storage.
- ML Pipeline: Sentinel-2 imagery + Mask R-CNN (Detectron2) for roof detection; USGS 3DEP LiDAR for pitch and slope; measurement engine computes area, perimeter, features, complexity, and confidence.
- Differentiators: Speed (<5 minutes), precision (±3%), mobile-assisted flow for low-confidence cases, and dramatically lower per-analysis cost.

## Target Users
- Primary: General Contractors
  - Needs: Accurate measurements for bidding, scheduling, and material planning.
  - Pain points: Time-consuming manual measurement; high vendor costs; delays when imagery is obstructed.
  - Goals: Faster, reliable bids; predictable crew planning.
- Secondary: Roofing Specialists
  - Needs: Feature identification (vents, chimneys, dormers) and pitch/slope details.
  - Goals: Fewer installation surprises; accurate materials and safety planning.
- Secondary: Insurance Adjusters
  - Needs: Exportable roof data for claims workflows.
  - Goals: Streamlined assessments; auditability.
- Secondary: Sales Teams
  - Needs: Clear, shareable measurement reports.
  - Goals: Enhanced customer engagement; improved close rates.

## Goals & Success Metrics
- Business Objectives
  - Achieve ±3% measurement accuracy.
  - Deliver results in under 5 minutes (p95).
  - Drive high adoption within 6 months among target users.
  - Provide seamless exportability to third-party tools.
  - Hit ~$0.06 per analysis average cost.
- User Success Metrics
  - Reduce time-to-bid preparation by ≥50%.
  - Decrease measurement-related errors and change orders.
  - Improve sales conversion rates with shareable reports.
- KPIs
  - LCP <2.5s (p75) on mobile.
  - API response <200ms (p95) for cached and lightweight endpoints.
  - ML processing <5 minutes (p95), alert at >7 minutes.
  - Redis cache hit rate ≥80% for completed analyses.
  - API 5xx error rate <5% over 5-minute windows.

## MVP Scope
- Core Features (Must Have)
  - High-precision measurement of roof edges, pitch, slope, area, and perimeter.
  - Feature identification (vents, chimneys, dormers, skylights, satellite dishes).
  - Mobile-assisted capture flow for low-confidence analyses.
  - Result export via shareable links, PDFs, and JSON.
  - Async processing via SQS with polling and cache-first results retrieval.
  - Four mobile-first screens: Address Input, Processing, Results, Mobile Assist.
  - Client-side PDF generation (jsPDF + html2canvas) with brand formatting.
- Out of Scope for MVP
  - Custom client integrations beyond core exports.
  - Extended AR features (beyond essential annotations).
  - User authentication and payment processing.
  - Real-time collaboration.
- MVP Success Criteria
  - End-to-end flow: address → processing → results with assist path when confidence <70%.
  - Accuracy: ±3% for area and perimeter targets; pitch confidence handling when LiDAR unavailable.
  - Performance: LCP <2.5s (p75); API <200ms (p95); ML <5 minutes (p95).
  - Reliability: 99.5% uptime with graceful degradation and resilient polling.

## Post-MVP Vision
- Phase 2 Features
  - Additional exports/integrations with estimating and insurance platforms.
  - Enhanced visualization for complexity mapping and feature overlays.
  - Server-sent events or backoff-friendly polling to reduce load.
  - Authentication, billing, and role-based access.
  - Fine-tuned roof detection models and Lambda optimizations (layers, GPU options).
- Long-term Vision
  - Predictive maintenance insights and multi-structure property support.
  - 3D reconstruction and richer AR guidance.
  - Regional expansion with data coverage heuristics and adaptive pipelines.
- Expansion Opportunities
  - Partnerships with insurers, material suppliers, and distributor networks.
  - Vertical expansion to facades, solar mounting, and gutter systems.

## Technical Considerations
- Platform Requirements
  - Target Platforms: Mobile web with responsive design and accessible components.
  - Browser/OS Support: Modern evergreen browsers; iOS/Android mobile Safari/Chrome.
  - Performance Requirements: LCP <2.5s; efficient client-side PDF generation; image lazy loading; strict polling intervals; stop on navigation.
- Technology Preferences
  - Frontend: Next.js 14 + React 18, shadcn/ui, Tailwind CSS.
  - Backend: Next.js API routes; Python ML on AWS Lambda.
  - Database: PostgreSQL with Prisma ORM.
  - Hosting/Infrastructure: Vercel (frontend/API), AWS (Lambda, SQS, S3, CloudWatch), Redis (Upstash/ElastiCache).
- Architecture Considerations
  - Repository Structure: App router (`app/`), modular lib layering (`lib/`), typed API clients, and utilities.
  - Service Architecture: Decoupled web tier and ML via SQS; cache-first results; DLQ for resiliency.
  - Integration Requirements: Sentinel Hub, USGS 3DEP, Google Maps (geocoding/places).
  - Security/Compliance: Environment-managed secrets; least-privilege IAM; input validation; rate limiting; potential CAPTCHA for public MVP abuse.

## Constraints & Assumptions
- Constraints
  - Sentinel-2 resolution (10m) limits accuracy for smaller structures without assist.
  - LiDAR coverage varies geographically; pitch confidence must degrade gracefully.
  - Public MVP (no auth) increases abuse risk; rate limiting and abuse detection required.
  - Mobile performance and battery constraints for client-side PDF/image processing.
- Key Assumptions
  - Consistent access to Sentinel Hub and USGS APIs.
  - Team devices can perform mobile capture with necessary sensors.
  - AWS services (Lambda, SQS, S3) available and configured.
  - Stable internet connectivity during analyses.

## Risks & Open Questions
- Key Risks
  - Accuracy vs resolution mismatch without assisted capture.
  - Thundering herd from 2s polling at scale; server load amplification.
  - Cache staleness and invalidation correctness for updated analyses.
  - Client-side PDF performance on low-end devices.
  - Abuse without auth; rate limiting might be insufficient.
- Open Questions
  - Complexity score formula (weights for features, polygon complexity, slope, confidence).
  - JSON export schema versioning and field definitions (required vs optional).
  - Data retention policy for addresses, images, and annotated outputs; privacy stance.
  - Confidence thresholds beyond 70% for assist; pitch confidence display behavior.
  - Mobile breakpoints and exact UX spec baselines for “matches UX spec exactly.”
  - Detailed cost model to validate ~$0.06 target under realistic load.
- Areas Needing Further Research
  - LiDAR availability maps and fallback strategies.
  - Model performance and confidence calibration across roof types.
  - Queue throughput and backoff strategies for polling.
  - Client-side PDF rendering optimizations and font embedding.

## Appendices
- A. Research Summary
  - PRD v1.2 approved (PO validation 94% completeness).
  - Architecture: Next.js + AWS Lambda ML; Redis cache; SQS; S3.
  - Non-functional requirements: performance, security, scalability, reliability targets.
- B. Stakeholder Input
  - Product team approval; architecture alignment validated; PO validation completed.
- C. References
  - `docs/PRD_CompanyCam_Precision_Roof_Measurement_v1.2_FINAL.md`

## Next Steps
1. Initialize Next.js 14 project with TypeScript, shadcn/ui, Tailwind tokens, ESLint/Prettier, Husky, and README.
2. Define OpenAPI stubs for `POST /api/analyze` and `GET /api/results/[id]` (include JSON schema and versioning).
3. Document complexity scoring and confidence calculations (UI display + API fields).
4. Implement cache-first results endpoint with strict TTL and invalidation rules; exclude in-progress statuses from caching.
5. Add client-side PDF generator utility with image downscaling, font embedding, pagination.
6. Create cost model for per-analysis drivers (API calls, Lambda duration, data egress) to validate ~$0.06.
7. Establish monitoring thresholds and alerts (API errors, timeouts, cache hit rate, DLQ messages).

---
This Project Brief provides full context for CompanyCam Precision Roof Measurement. Please start in PRD Generation Mode, review the brief, and proceed to create or refine PRD sections, asking for clarification where needed.
