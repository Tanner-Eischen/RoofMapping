# Epic 4: ML Processing Pipeline

**Epic Goal:** Implement the Python-based ML service that analyzes satellite imagery and LiDAR data to produce roof measurements.

**Epic Priority:** P0 (Must-have for MVP)

---

## Story 4.1: Lambda Handler & Service Architecture

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

## Story 4.2: Sentinel-2 Satellite Imagery Integration

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

## Story 4.3: USGS LiDAR Data Integration

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

## Story 4.4: Mask R-CNN Roof Detection

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

## Story 4.5: Measurement Calculation Engine

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

## Story 4.6: Lambda Deployment Pipeline

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

## Story 4.7: Database Result Storage

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
