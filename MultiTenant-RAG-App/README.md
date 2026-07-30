# Multi-Tenant RAG SaaS Platform

A multi-tenant SaaS platform for uploading PDF documents and retrieving accurate, AI-generated answers using Retrieval-Augmented Generation (RAG). Built with NestJS (TypeScript), Python FastAPI (RAG microservice), and Next.js (frontend). Hosted entirely on free-tier services.

## Stack

- **Frontend:** Next.js 14+ (TypeScript, Tailwind CSS, shadcn/ui)
- **Main API:** NestJS (TypeScript/Node.js)
- **RAG Microservice:** Python FastAPI (self-hosted)
- **Vector DB:** Qdrant (self-hosted, unlimited vectors)
- **Database:** Oracle Cloud Autonomous DB / Neon PostgreSQL (free tier)
- **File Storage:** Oracle Cloud Object Storage (20GB free)
- **LLM:** Google Gemini API (free tier) or Ollama (self-hosted, free)
- **Job Queue:** Upstash Redis (free tier)
- **Deployment:** Oracle Cloud Always Free Tier + Vercel (frontend)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (free tier) + Oracle Cloud Monitoring

## Free Services Used

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| Oracle Cloud Always Free | 2 ARM VMs, 24GB RAM | Backend + RAG microservice hosting |
| Oracle Cloud Object Storage | 20GB | Document storage |
| Vercel | Hobby plan | Frontend hosting |
| Cloudflare Free | Unlimited | DNS + CDN |
| GitHub Actions | 2000 min/month | CI/CD |
| Google Gemini API | Free tier | Embeddings + LLM generation |
| Qdrant | Self-hosted (free) | Vector database |
| Upstash Redis | 10K commands/day | Job queue |
| Sentry | 5K events/month | Error tracking |

## Project Structure

```
MultiTenant-RAG-App/
  README.md                  <-- This file
  .gitignore                 <-- Git ignore rules
  docker-compose.yml         <-- Local development orchestration
  docs/                      <-- All project documentation
    README.md                <-- Documentation index
    PROJECT-PLAN.md          <-- Master plan & build order
    01-project-kickoff.md    <-- Ch 1: Vision, goals, scope
    02-requirements-engineering.md <-- Ch 2: Functional & non-functional requirements
    03-domain-business-modeling.md <-- Ch 3: Entities, actors, workflows
    04-solution-architecture.md     <-- Ch 4: System design & components
    05-data-design.md               <-- Ch 5: Database & vector schemas
    06-api-design.md                <-- Ch 6: REST endpoints & contracts
    07-backend-foundation.md        <-- Ch 7: NestJS + Python microservice setup
    08-core-backend-modules.md      <-- Ch 8: Auth, tenants, documents, search modules
    09-frontend-development-overview.md <-- Ch 9: Frontend development guide
    09a-frontend-template.md  <-- Ch 9: Feature implementation template
    09b-frontend-example.md   <-- Ch 9: RAG SaaS dashboard example
    10-testing-qa.md          <-- Ch 10: Testing strategy, test cases, QA gates
    11-deployment-devops.md   <-- Ch 11: Deployment, CI/CD, monitoring
```

## Quick Start (Development)

```bash
# Clone the repository
git clone <repo-url>
cd MultiTenant-RAG-App

# Start all services with Docker Compose
docker-compose up -d
```

## Modules

1. Auth — signup, login, JWT tokens
2. Users — user profile management
3. Tenants — tenant management, team members
4. Documents — upload, parse, process, search
5. Search — RAG pipeline for grounded answers
6. Conversations — query history
7. API Keys — programmatic access
8. Notifications — email for invites and alerts

## Documentation

All project documentation lives in the `docs/` directory:

| File | Chapter | Phase |
|------|---------|-------|
| `01-project-kickoff.md` | Ch 1 | Phase 1 — Understand the Client |
| `02-requirements-engineering.md` | Ch 2 | Phase 1 — Understand the Client |
| `03-domain-business-modeling.md` | Ch 3 | Phase 2 — Design |
| `04-solution-architecture.md` | Ch 4 | Phase 2 — Design |
| `05-data-design.md` | Ch 5 | Phase 2 — Design |
| `06-api-design.md` | Ch 6 | Phase 2 — Design |
| `07-backend-foundation.md` | Ch 7 | Phase 3 — Development |
| `08-core-backend-modules.md` | Ch 8 | Phase 3 — Development |
| `09-frontend-development-overview.md` | Ch 9 | Phase 3 — Development |
| `09a-frontend-template.md` | Ch 9 | Phase 3 — Development |
| `09b-frontend-example.md` | Ch 9 | Phase 3 — Development |
| `10-testing-qa.md` | Ch 10 | Phase 3 — Development |
| `11-deployment-devops.md` | Ch 11 | Phase 4 — Delivery |
| `PROJECT-PLAN.md` | — | Master plan |

This repository doubles as a project documentation book. The `docs/` directory contains all design documents as the project progresses through each phase.

## License

MIT
