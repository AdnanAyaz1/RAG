# Multi-Tenant RAG SaaS - Project Plan

---

## Stack (All Free)

| Layer | Service | Details |
|-------|---------|---------|
| Frontend | Vercel | Hobby plan, 100GB bandwidth |
| Main API | Oracle Cloud Always Free | 2 ARM VMs, 24GB RAM total |
| RAG Microservice | Python FastAPI on Oracle VM | Same VM as backend |
| Vector DB | Qdrant (self-hosted) | Unlimited vectors on VM |
| File Storage | Oracle Cloud Object Storage | 20GB free |
| LLM (Embeddings + Gen) | Google Gemini API | Free tier, no credit needed |
| Job Queue | Upstash Redis | 10K commands/day free |
| Auth/Secrets | Env vars + Oracle Vault | Free |
| CI/CD | GitHub Actions | 2000 min/month free |
| Registry | GitHub Container Registry | Free |
| Monitoring | Sentry (free tier) + Oracle Cloud Monitoring | Free |
| DNS/CDN | Cloudflare Free | Unlimited |
| Database | PostgreSQL via Neon (free 0.5GB) or SQLite for MVP | Included with Oracle tier |

**Estimated cost: $0/month**

---

## Why Qdrant (not Pinecone)

Pinecone Starter is capped at 100MB. A single 50MB PDF produces 500+ chunks, each a 1536-dim vector (~6KB). That is ~3MB per PDF in vectors alone. With 4-5 test PDFs, Pinecone's free cap is hit quickly. Qdrant self-hosted on our Oracle VM has no such cap and handles unlimited vectors on disk.

---

## Why Google Gemini (not OpenAI)

OpenAI gives a $5 trial that expires. Gemini's free tier is generous indefinitely and better suited for accuracy testing with many large PDFs. Ollama (self-hosted) is a third option for zero external API costs.

---

## Build Order

### Week 1: Foundation
1. Create GitHub repo with `backend/`, `rag-service/`, `frontend/` dirs
2. Initialize NestJS backend with Prisma + module scaffolding
3. Initialize Python FastAPI rag-service with OpenAI + Qdrant clients
4. Initialize Next.js frontend with auth + React Query scaffolding
5. Docker Compose for local dev (all services)
6. GitHub Actions CI/CD pipeline

### Week 2: Core Features
7. Auth module (NestJS) — signup, login, JWT
8. Tenants + Users modules (NestJS)
9. Documents module — upload, S3 storage, job queue
10. Python RAG pipeline — PDF parser, chunker, embedder, Qdrant indexer
11. Search module — query embedding, Qdrant search, LLM answer

### Week 3: Frontend + Polish
12. Next.js pages (login, dashboard, documents, search, conversations)
13. API Keys, Team, Settings pages
14. Unit + integration tests (Jest, pytest, Playwright)
15. Responsiveness and accessibility

### Week 4: Hardening & Release
16. Performance optimization
17. Security testing (tenant isolation, penetration)
18. Deploy to staging, smoke tests
19. Production deployment checklist
20. Client demo and acceptance

---

## Key Decisions (Log)

| # | Decision | Doc |
|---|----------|-----|
| 1 | Multi-tenant RAG SaaS product | `01-project-kickoff.md` |
| 2 | NestJS main API + Python RAG microservice | `07-backend-foundation.md` |
| 3 | Modular monolith over microservices | `04-solution-architecture.md` |
| 4 | PostgreSQL + Qdrant for data | `05-data-design.md` |
| 5 | Google Gemini API for LLM | `06-api-design.md` |
| 6 | JWT + HTTP-only cookie auth | `07-backend-foundation.md` |
| 7 | RBAC with 3 roles | `08-core-backend-modules.md` |
| 8 | All free-tier services | This plan |

---

## Open Questions

1. Which Oracle Cloud region to use?
2. Who is the first pilot tenant?
3. Need a landing page separate from the app?
4. Pricing model per tenant?
5. Notification service choice for emails?
6. Do we need staging environment separately?

---

# End of Project Plan
