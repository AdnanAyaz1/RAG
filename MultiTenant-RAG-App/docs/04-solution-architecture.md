# Chapter 05 — Solution Architecture Design

---

# Objective

The purpose of Solution Architecture Design is to define the high-level technical structure of the multi-tenant RAG SaaS platform before implementation begins. This chapter converts the business requirements and domain model into a technical blueprint that explains how different parts of the system will communicate and work together.

---

# Q&A

## Q1: What is the system overview?

**Answer:**

**Project Description:** A multi-tenant SaaS platform that enables organizations to upload documents and retrieve accurate, AI-generated answers using Retrieval-Augmented Generation (RAG). Each tenant's documents and data are isolated from all other tenants, ensuring security and privacy.

**Business Goal:** Provide organizations with an instant, AI-powered way to search and extract insights from their document collections — without building their own RAG infrastructure.

**Main Users:**

- Tenant Admins — manage documents, team members, and settings
- End Users — search and retrieve information using natural language
- Platform Admins — oversee system health, tenant management, escalations

**Why:** The system summary establishes the shared understanding of what we're building. The business goal defines the value proposition. The main users clarify who the system serves, which directly influences feature priority and complexity.

---

## Q2: What architecture pattern will we use?

**Answer:**

**Selected Architecture:** Modular Monolith

**Reason:** A modular monolith gives us the speed and simplicity of a single deployable application while maintaining clear separation between business domains. For a 4-week MVP building a SaaS product, this is the right balance — we avoid the operational complexity of microservices (network latency, distributed tracing, inter-service communication) while still keeping modules independently testable and loosely coupled. If the product scales to demand independent scaling of the RAG pipeline, we can extract services later.

**Why:** The architecture choice is driven by the timeline and team size. Microservices introduce too much complexity for an MVP — service discovery, distributed transactions, cross-service authentication, and deployment coordination are all overhead we don't need yet. A modular monolith with clear module boundaries gives us a clean path to microservices later if needed. It also simplifies deployment — one Docker container or set of containers, one CI/CD pipeline, one codebase.

---

## Q3: What are the system components?

**Answer:**

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| Web Application | User interface for upload, search, dashboard | Next.js (React, TypeScript) |
| API Server | Business logic, RAG pipeline orchestration, auth | Python / FastAPI |
| Vector DB | Embedding storage and similarity search | Pinecone Cloud |
| Relational DB | Metadata — tenants, users, documents, conversations | PostgreSQL |
| File Storage | Raw document storage | AWS S3 |
| Background Worker | Document parsing, chunking, embedding generation | Python / FastAPI (Celery or async workers) |
| Embedding Service | Generate vector embeddings via OpenAI | OpenAI API |
| LLM Service | Generate RAG answers via OpenAI | OpenAI API |
| Email Service | Tenant invites, notifications | SMTP (e.g., Resend) |
| Auth Service | JWT-based authentication and tenant-scoped sessions | FastAPI + JWT |

**Why:** Each component maps to a specific business or technical responsibility. The separation of API Server and Background Worker is important — document processing is a long-running task that should not block API responses. The Vector DB and Relational DB serve different purposes — Pinecone for fast similarity search on embeddings, PostgreSQL for relational data with strong consistency and querying. The LLM and Embedding services are external but well-defined dependencies. This component map is the foundation for the system-level architecture diagram.

---

## Q4: What is the high-level architecture diagram?

**Answer:**

```
End User (Browser)
    ↓
Next.js Web Application (Static assets + SSR)
    ↓ HTTP/REST
FastAPI Backend Server
    ↓
├── Auth Module (JWT validation, tenant ID extraction)
├── Document Module (upload, file storage in S3, trigger processing)
├── Search Module (embed query, Pinecone similarity search, RAG generation)
├── Tenant Module (tenant CRUD, user management, settings)
├── Conversation Module (query history, response storage)
├── Background Worker Module (document parsing → chunking → embedding → Pinecone indexing)
↓
├── PostgreSQL (metadata: users, tenants, documents, conversations)
├── S3 (raw files)
├── Pinecone (vector embeddings per tenant namespace)
├── OpenAI API (embeddings + LLM generation)
└── SMTP (emails)
```

**Why:** The architecture diagram shows how data flows from the end user through the system to the external services and back. The Auth Module sits at the entry point — every request must carry a tenant context. The Search Module is the core RAG path — it embeds the query, searches Pinecone with tenant filtering, retrieves chunks, sends them to the LLM with the original question, and returns the answer with citations. Background Workers are decoupled from the request/response cycle — they process documents asynchronously, which keeps the API responsive. The diagram also shows that the Frontend never talks directly to Pinecone or OpenAI — all AI operations go through the backend, keeping API keys and business logic server-side.

---

## Q5: What is the frontend architecture?

**Answer:**

**Framework:** Next.js 14+ with App Router

**State Management:** Zustand for global state (auth, tenant context) + React Query for server state (API caching and synchronization)

**UI Library:** Tailwind CSS + shadcn/ui for consistent, accessible components

**Responsibilities:**

- Render the tenant dashboard (upload, document list, settings)
- Provide the search/chat interface for end users
- Handle authentication flow (login, signup, invite acceptance)
- Communicate with the FastAPI backend via REST
- Display RAG answers with source citations and document links
- Show upload progress for document processing
- Handle tenant scoping — all API calls include the tenant context from JWT

**Why:** Next.js was chosen for its developer experience, SSR capabilities, and production readiness. Zustand is lightweight and sufficient for SaaS-level state. Tailwind + shadcn/ui gives us a consistent, modern UI without CSS overhead. React Query manages the async data fetching pattern that the RAG search feature requires — caching, refetching, and optimistic updates. The frontend's responsibility to scope all requests to the tenant is critical — the backend enforces isolation, but the UI should not attempt to fetch other tenants' data (even though the backend would reject it).

---

## Q6: What is the backend architecture?

**Answer:**

**Framework:** FastAPI (Python)

**API Style:** REST with JSON request/response bodies

**Module Structure:**

- `auth/` — JWT token creation/validation, password hashing, middleware
- `tenants/` — tenant CRUD, user management within tenant, invitations
- `documents/` — upload handling, S3 storage, document metadata
- `search/` — query embedding, Pinecone retrieval, LLM call, answer generation
- `workers/` — background task definitions (document processing pipeline)
- `conversations/` — query history storage and retrieval
- `config/` — centralized configuration (env vars, secrets)
- `database/` — Prisma client setup, connection management
- `common/` — shared utilities (logging, error handling, validation)

**Responsibilities:**

- Validate all incoming requests (Pydantic models)
- Enforce tenant isolation on every database and vector DB query
- Orchestrate the RAG pipeline: embed query → search Pinecone → retrieve chunks → call LLM → return grounded answer
- Manage authentication and authorization (JWT + role-based checks)
- Return consistent, structured error responses
- Trigger background workers for document processing

**Why:** FastAPI was chosen for its async support, Pydantic integration for validation, and developer productivity. REST is the right choice for an MVP — gRPC adds complexity without benefit for a web-based SaaS. The module structure follows domain boundaries from the domain model, ensuring each module maps to a business capability. Tenant isolation enforcement must happen at the backend level on every query — the database layer includes tenant_id as a filter, and the vector DB uses tenant-scoped namespaces. The RAG orchestration module is the core of the product — its design determines whether answers are accurate and grounded.

---

## Q7: What is the database architecture?

**Answer:**

**Primary Database:** PostgreSQL (metadata)

**ORM:** Prisma

**Vector Database:** Pinecone Cloud (embeddings and similarity search)

**Data Storage Strategy:**

- **PostgreSQL** stores all relational metadata: tenant records, user records, document records (with status), conversation records, API keys, invitations. Prisma handles migrations, typesafety, and connection pooling.
- **Pinecone** stores vector embeddings indexed by tenant namespace. Each tenant gets a unique namespace. Pinecone handles the similarity search — given an embedding vector, it returns the top-K most similar chunks ranked by cosine similarity.
- **S3** stores the raw uploaded files so they can be re-processed if needed (e.g., chunk size change, model upgrade).

**Why:** PostgreSQL and Pinecone serve different purposes and cannot replace each other. PostgreSQL is the source of truth for structured data with relational integrity and transactional consistency. Pinecone is optimized for vector similarity search — it can find the most relevant chunks in milliseconds at scale. S3 provides durable, cheap file storage. The separation means each database is used for what it does best. Prisma's type safety reduces bugs and makes schema changes visible through TypeScript types.

---

## Q8: How do system components communicate?

**Answer:**

```
User submits query →
Next.js frontend sends POST /api/search with question and JWT →
FastAPI validates JWT, extracts tenant_id →
FastAPI embeds the query using OpenAI embed endpoint →
FastAPI calls Pinecone query with tenant namespace filter →
Pinecone returns top-K relevant chunks →
FastAPI constructs prompt with chunks + question →
FastAPI calls OpenAI chat endpoint →
OpenAI returns grounded answer →
FastAPI formats response with citations →
Returns JSON to frontend →
Frontend displays answer with source links
```

```
User uploads document →
Next.js sends multipart/form-data POST /api/documents with JWT →
FastAPI validates file, stores in S3 →
Creates document record in PostgreSQL (status: processing) →
Queues background job →
Background Worker picks up job →
File retrieved from S3 →
PDF/DOCX parsed to text →
Text split into chunks (512 tokens, 50 overlap) →
Each chunk embed sent to OpenAI →
Embeddings stored in Pinecone under tenant namespace →
Document status updated to indexed in PostgreSQL →
Notification sent to Tenant Admin
```

**Why:** The communication flow shows the two critical paths — synchronous (search/retrieval) and asynchronous (document processing). Search is synchronous because the user expects an immediate answer. Document processing is asynchronous because parsing and embedding can take seconds per document, and making the user wait would be a poor experience — instead they see a progress indicator. The tenant_id extracted from the JWT flows through every component — it's the key to multi-tenancy. Frontend never calls Pinecone or OpenAI directly — all AI operations are backend-mediated to protect API keys and enforce business rules.

---

## Q9: What is the security architecture?

**Answer:**

**Authentication:**

- JWT Access Token (short-lived, 15 min) + Refresh Token (longer-lived, 7 days)
- Password hashed with bcrypt before storage
- Tokens stored in HTTP-only cookies (not localStorage) to prevent XSS theft
- All API endpoints require a valid JWT except signup and login
- JWT payload includes `user_id` and `tenant_id` — the backend uses `tenant_id` to scope all data access

**Authorization:**

- Role-Based Access Control (RBAC)
- Roles: `tenant_admin`, `end_user`, `platform_admin`
- Each endpoint checks the user's role against required permissions
- Tenant-scoped data access — users can only query their own tenant's data
- Platform admin can manage tenants but cannot access tenant document content

**Encryption:**

- HTTPS for all traffic (TLS 1.2+)
- Database encryption at rest (managed by cloud provider)
- S3 server-side encryption for stored files
- Secrets (JWT secret, OpenAI API key, DB credentials) stored in environment variables — never in code

**Secrets Management:**

- Environment variables for all secrets
- `.env` files excluded from git via `.gitignore`
- In production, secrets injected via the deployment environment (e.g., GitHub Secrets, AWS Secrets Manager)

**Why:** The security architecture protects the multi-tenant model's core promise — tenant data isolation. If authentication is compromised, tenant boundaries break. JWT with tenant_id in the payload is the mechanism that enforces isolation at every layer. HTTP-only cookies for tokens mitigate XSS attacks. HTTPS, encryption at rest, and secret management protect data in transit and at rest. RBAC ensures that even within a tenant, users can only perform actions appropriate to their role.

---

## Q10: What is the deployment architecture?

**Answer:**

**Hosting:** Cloud platform (AWS or equivalent)

**Infrastructure:**

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Vercel / AWS CloudFront + S3 | Static hosting + CDN |
| Backend | Containerized service (Docker) on ECS or App Runner | Run FastAPI application |
| Database | Managed PostgreSQL (AWS RDS) | Metadata storage |
| Vector DB | Pinecone Cloud | Managed vector database |
| File Storage | AWS S3 | Document storage |
| Background Workers | Separate container or ECS task | Async document processing |
| DNS | Route53 | Domain management |
| SSL | AWS Certificate Manager | HTTPS certificates |

**CI/CD:**

- Repository: GitHub
- CI: GitHub Actions
- Pipeline steps:
  1. Install dependencies (pnpm install, pip install -r requirements.txt)
  2. Run linter and formatter (ESLint, Prettier, Black, Ruff)
  3. Run unit tests (Jest for frontend, pytest for backend)
  4. Run integration tests (database, Pinecone connectivity)
  5. Build Docker image for backend + Next.js frontend
  6. Push image to registry (ECR or Docker Hub)
  7. Deploy to staging environment
  8. Run smoke tests against staging
  9. Deploy to production (manual approval gate)

**Monitoring:**

- Application monitoring: Sentry (error tracking)
- Server monitoring: CloudWatch or Datadog
- Database monitoring: PostgreSQL performance metrics via RDS
- API response time tracking via custom middleware + Sentry
- Alerting: Email notifications for critical errors, PagerDuty for on-call escalation

**Why:** The deployment architecture ensures the platform is reliable, observable, and deployable from a single pipeline. Vercel for the frontend provides instant CDN distribution and easy Next.js deployment. Containerized backend on ECS/App Runner allows horizontal scaling — when more tenants are added, more backend containers can spin up. Pinecone Cloud and managed RDS reduce operational overhead — no self-managed database maintenance. The CI/CD pipeline with staging and production separation prevents bad deployments from reaching users. Monitoring and alerting ensure we know when something is broken before tenants do.

---

## Q11: What technology decisions were made and why?

**Answer:**

| Decision | Reason |
|----------|--------|
| Next.js (frontend) | Production-ready React framework, SSR support, Vercel deployment, great DX |
| FastAPI (backend) | Async-native, Pydantic validation, fast development, Python ML ecosystem |
| PostgreSQL (metadata) | Strong relational model for multi-tenant data, Prisma ORM support, mature ecosystem |
| Pinecone (vector DB) | Managed service, tenant namespace support, fast similarity search, scales well |
| OpenAI API (embeddings + LLM) | Industry leader, easy integration, good quality embeddings and generation |
| Prisma (ORM) | Type-safe database access, auto-generated TypeScript types, migration management |
| Docker (containerization) | Consistent environments, easy deployment, local dev parity |
| TypeScript | Type safety on frontend, catches errors at compile time |
| Zustand (state mgmt) | Lightweight, sufficient for SaaS-level app state |
| Tailwind CSS + shadcn/ui | Rapid UI development, consistent design system |
| GitHub Actions (CI/CD) | Integrated with GitHub, free for public/many private repos, industry standard |
| AWS S3 (file storage) | Durable, cheap, integrates well with other AWS services |

**Why:** Each technology decision is driven by the project constraints — the 4-week timeline, multi-tenancy requirements, RAG pipeline needs, and lean budget. OpenAI and Pinecone are managed services that eliminate infrastructure complexity. FastAPI + Pydantic provides validation and type safety out of the box. Prisma bridges the gap between PostgreSQL's relational model and TypeScript on the frontend. Docker ensures the dev environment matches production. The full stack is JavaScript/TypeScript + Python — each language used where it excels (TypeScript for web, Python for ML/AI pipeline).

---

## Q12: What are the architecture-level risks?

**Answer:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM cost exceeds budget at scale | High | Implement caching — cache queries and results per tenant; set per-tenant query limits |
| Pinecone vendor lock-in | Medium | Abstract vector DB behind a repository interface — switchable if needed |
| Background worker scaling | Medium | Use ECS/Fargate with auto-scaling; monitor queue depth |
| Document parsing errors for edge-case PDFs | Medium | Validate file integrity after parse; fall back to text extraction libraries |
| JWT token theft | High | Use HTTP-only cookies; short access token expiry; refresh token rotation |
| Single point of failure (single region) | Medium | Deploy backend in multi-AZ; Pinecone has built-in replication |
| Slow cold-start for containerized backend | Medium | Keep at least one standby container; use warmers or min instances |

**Why:** Architecture risks are about decisions that affect the entire system, not individual features. LLM costs are a real concern for SaaS products — each user query costs money, and costs can spiral if the same queries are answered repeatedly. Pinecone lock-in is mitigated by abstracting the vector DB behind an interface so we can swap it later. Background worker scaling determines whether the system keeps up with document upload volume. JWT theft is a security risk — HTTP-only cookies and short expiry reduce the attack surface. Single-point-of-failure risks threaten the SaaS availability SLA. Each risk has a specific, actionable mitigation rather than vague "monitor it" advice.

---

## Q13: Who approves the solution architecture?

| Role | Name |
|------|------|
| Technical Lead | (To be assigned) |
| Architect | (To be assigned) |
| Product Owner | (To be assigned) |
| Date | (To be set) |

**Why:** Architecture approval ensures the design is technically sound, aligns with business goals, and is feasible within the timeline and budget. The technical lead validates the choices from an implementation perspective. The product owner confirms the architecture supports the required features. Without approval, the team risks building on a shaky foundation.