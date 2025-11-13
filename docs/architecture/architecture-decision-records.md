# Architecture Decision Records

## ADR-001: Next.js Full-Stack Framework

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

## ADR-002: Serverless ML Processing

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

## ADR-003: Public Data Sources

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

## ADR-004: Hybrid AI + Mobile Approach

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
