# Development Workflow

## Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/companycam/roof-measurement.git
cd roof-measurement

# 2. Install dependencies
pnpm install

# 3. Setup database
docker-compose up -d postgres redis
pnpm prisma migrate dev

# 4. Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 5. Start development server
pnpm dev
```

## Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "ml:test": "cd ml-service && pytest"
  }
}
```

## Git Workflow

1. **Feature Branch:** `git checkout -b feature/roof-detection-improvements`
2. **Commit:** Follow conventional commits (`feat:`, `fix:`, `docs:`)
3. **Push:** Triggers preview deployment on Vercel
4. **PR:** Code review + automated tests
5. **Merge:** Deploy to production

## Testing Strategy

**1. Unit Tests (Jest)**
- Utils functions
- Repository methods
- React hooks

**2. Integration Tests (Jest + Supertest)**
- API routes
- Database operations
- Queue interactions

**3. E2E Tests (Playwright)**
- Full user flows
- Mobile assist flow
- PDF generation

**4. ML Tests (Pytest)**
- Roof detection accuracy
- Measurement calculations
- External API mocks

```typescript
// Example test
describe('Analysis API', () => {
  it('should create analysis', async () => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        address: '1234 Main St',
        lat: 30.2672,
        lng: -97.7431
      })
    })
    
    expect(response.status).toBe(202)
    const data = await response.json()
    expect(data).toHaveProperty('analysisId')
  })
})
```

## Code Quality Standards

1. **TypeScript:** Strict mode enabled
2. **ESLint:** Airbnb + React rules
3. **Prettier:** Auto-format on save
4. **Husky:** Pre-commit hooks for lint + test
5. **Conventional Commits:** Required for meaningful history

---
