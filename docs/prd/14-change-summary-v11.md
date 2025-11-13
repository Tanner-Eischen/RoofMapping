# 14. Change Summary (v1.1)

## New Stories Added

1. **Story 1.3: Redis Caching Layer** - Critical for results polling performance and database load reduction
2. **Story 3.2: SQS Queue Integration** - Decouples web tier from ML processing, enables horizontal scaling
3. **Story 4.6: Lambda Deployment Pipeline** - Automates ML service deployments via CI/CD

## Story Refinements

1. **Story 3.1: Analysis Submission Endpoint** - Now explicitly separate from queue integration
2. **Epic 4 Stories** - Added separate stories for Sentinel and USGS clients (previously combined)
3. **Story 4.7: Database Result Storage** - New story for Lambda to update database (previously implicit)

## Enhanced Requirements

- Added specific performance metrics (LCP, API response times)
- Added caching requirements (Redis with 1-hour TTL)
- Added queue requirements (SQS with dead letter queue)
- Added infrastructure requirements (Lambda memory, timeout)
- Added CI/CD requirements (GitHub Actions deployment)

---
