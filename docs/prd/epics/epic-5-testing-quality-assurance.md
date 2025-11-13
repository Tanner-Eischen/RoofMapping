# Epic 5: Testing & Quality Assurance

**Epic Goal:** Ensure the application is reliable, performant, and meets acceptance criteria through comprehensive testing.

**Epic Priority:** P0 (Must-have for MVP)

---

## Story 5.1: Unit Tests for Frontend Components

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

## Story 5.2: Integration Tests for API Routes

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

## Story 5.3: E2E Tests for User Flows

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

## Story 5.4: ML Pipeline Testing

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

## Story 5.5: Performance Testing

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
