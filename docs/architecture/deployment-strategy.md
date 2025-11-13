# Deployment Strategy

## Infrastructure

**Production Stack:**
- **Frontend + API:** Vercel (serverless, edge network)
- **Database:** Heroku PostgreSQL (or AWS RDS)
- **Cache:** Upstash Redis (serverless Redis)
- **ML Processing:** AWS Lambda + ECR (Docker containers)
- **Queue:** AWS SQS
- **Storage:** AWS S3 + CloudFront CDN

## Deployment Workflow

```mermaid
graph LR
    Dev[Developer] --> Git[Git Push]
    Git --> CI[GitHub Actions CI]
    CI --> Tests[Run Tests]
    Tests --> Preview[Vercel Preview]
    Preview --> Review[Code Review]
    Review --> Merge[Merge to Main]
    Merge --> Vercel[Vercel Production]
    Merge --> Lambda[Deploy Lambda]
    Lambda --> Done[Deployed]
    Vercel --> Done
```

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
  
  deploy-lambda:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Lambda Docker image
        run: |
          cd ml-service
          docker build -t roof-ml-processor .
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag roof-ml-processor:latest $ECR_REGISTRY/roof-ml-processor:latest
          docker push $ECR_REGISTRY/roof-ml-processor:latest
      - name: Update Lambda function
        run: |
          aws lambda update-function-code \
            --function-name roof-ml-processor \
            --image-uri $ECR_REGISTRY/roof-ml-processor:latest
```

## Environment Configuration

```bash
# .env.example

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_maps_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/companycam

# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
ML_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123/roof-ml-queue
S3_BUCKET=companycam-roof-measurements

# Sentinel Hub
SENTINEL_CLIENT_ID=your_sentinel_id
SENTINEL_CLIENT_SECRET=your_sentinel_secret
```

## Rollback Strategy

1. **Frontend:** Vercel instant rollback via dashboard
2. **Lambda:** AWS Lambda version aliases
3. **Database:** Prisma migration rollback
4. **Feature Flags:** Environment variables for quick toggles

---
