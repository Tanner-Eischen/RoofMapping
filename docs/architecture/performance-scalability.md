# Performance & Scalability

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Page Load (LCP) | <2.5s | Code splitting, image optimization |
| API Response | <200ms | Redis caching, database indexes |
| ML Processing | <5min | Parallel processing, optimized models |
| Concurrent Users | 100 | Vercel auto-scaling, Lambda concurrency |

## Frontend Optimization

1. **Code Splitting:** Lazy load camera and PDF components
2. **Image Optimization:** Next.js Image component with WebP
3. **Caching:** Service worker for offline capability (future)
4. **Bundle Size:** Tree-shaking, dynamic imports

## Backend Optimization

1. **Database Indexes:** On `status`, `createdAt`, `analysisId`
2. **Connection Pooling:** Prisma connection pool (10 connections)
3. **Redis Caching:** 1-hour TTL for completed analyses
4. **Query Optimization:** Select only needed fields

## ML Pipeline Optimization

1. **Model Loading:** Pre-load Mask R-CNN in Lambda cold start
2. **Parallel Processing:** Fetch Sentinel + LiDAR concurrently
3. **Image Preprocessing:** Resize to 512x512 before inference
4. **Lambda Memory:** 3GB for ML workloads (CPU-optimized)

## Scalability Strategy

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
