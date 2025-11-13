# Technology Stack

## Frontend Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Framework | Next.js | 14.2+ | React framework with SSR/SSG | App Router, server components, built-in API routes |
| UI Library | React | 18.3+ | Component-based UI | Industry standard, extensive ecosystem |
| UI Components | shadcn/ui | Latest | Pre-built accessible components | Tailwind-based, customizable, accessible |
| Styling | Tailwind CSS | 3.4+ | Utility-first CSS | Matches UX spec, rapid development |
| Type Safety | TypeScript | 5.0+ | Static typing | Prevents runtime errors, better DX |
| State Management | React Context + Hooks | Built-in | Local state management | Sufficient for MVP, no Redux needed |
| Forms | React Hook Form | 7.x | Form validation | Performance, minimal re-renders |
| Camera | react-webcam | 7.2+ | Camera capture | Mobile camera integration |
| Maps | @vis.gl/react-google-maps | 1.0+ | Address autocomplete | Google Places API wrapper |
| PDF Generation | jsPDF + html2canvas | 2.5+, 1.4+ | Client-side PDF export | No server processing needed |
| HTTP Client | Native fetch | Built-in | API requests | Modern, no axios needed |
| Icons | lucide-react | 0.400+ | Icon system | Tree-shakeable, matches UX spec |

## Backend Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| API Framework | Next.js API Routes | 14.2+ | REST API endpoints | Collocated with frontend, TypeScript |
| Database | PostgreSQL | 15+ | Primary datastore | JSONB for flexible schemas, PostGIS for geo |
| ORM | Prisma | 5.x | Database ORM | Type-safe queries, migrations |
| Cache | Redis | 7.x | Results caching | Fast reads for polling, reduces DB load |
| Queue | AWS SQS | - | Async job queue | Managed service, reliable delivery |
| Object Storage | AWS S3 | - | Image/PDF storage | Durable, CDN integration |
| File Upload | Vercel Blob | Latest | Temporary photo storage | Integrated with Next.js deployment |

## ML Processing Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Runtime | Python | 3.11 | ML execution environment | Standard for ML/AI workloads |
| ML Framework | PyTorch | 2.0+ | Deep learning | Mask R-CNN pretrained models |
| Computer Vision | Detectron2 | Latest | Mask R-CNN implementation | Facebook Research, production-ready |
| LiDAR Processing | PDAL + Open3D | Latest | Point cloud analysis | Industry standard for LiDAR |
| Geospatial | GDAL + Rasterio | Latest | Satellite imagery | Read GeoTIFF, coordinate transforms |
| API Client | requests + boto3 | Latest | External API calls | Sentinel Hub, USGS, S3 access |
| Serverless Runtime | AWS Lambda | Python 3.11 | ML compute | Auto-scaling, pay-per-use |
| Container | Docker | Latest | Lambda packaging | Custom ML dependencies |

## External Services

| Service | Purpose | API/SDK |
|---------|---------|---------|
| Sentinel Hub | Satellite imagery | REST API (Free tier) |
| USGS 3DEP | LiDAR data | REST API (Free) |
| Google Maps | Address autocomplete | Places API |
| Vercel | Frontend hosting | Built-in |
| AWS Lambda | ML processing | boto3 SDK |
| AWS SQS | Job queue | boto3 SDK |
| AWS S3 | Object storage | boto3 SDK |

## Development Tools

| Category | Tool | Purpose |
|----------|------|---------|
| Package Manager | pnpm | Fast, disk-efficient |
| Linting | ESLint | Code quality |
| Formatting | Prettier | Code style |
| Testing | Jest + React Testing Library | Unit/integration tests |
| E2E Testing | Playwright | End-to-end tests |
| API Testing | Postman | API development |
| Git Hooks | Husky | Pre-commit checks |

---
