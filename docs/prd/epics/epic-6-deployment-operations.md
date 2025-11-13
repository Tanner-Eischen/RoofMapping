# Epic 6: Deployment & Operations

**Epic Goal:** Deploy the application to production and establish operational procedures.

**Epic Priority:** P0 (Must-have for MVP)

---

## Story 6.1: Vercel Production Deployment

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

## Story 6.2: AWS Infrastructure Setup

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

## Story 6.3: Database Production Setup

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

## Story 6.4: Redis Cache Production Setup

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

## Story 6.5: Monitoring & Alerting

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

## Story 6.6: Documentation & Runbook

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
