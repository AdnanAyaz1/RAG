# Sprint Plan

---

## Sprint 0: Setup & Foundation (Week 0, 2-3 days)

**Goal:** Have a working dev environment with all services running locally.

### Tasks

1. Initialize GitHub repo with NestJS backend scaffold (nest new backend)
2. Initialize Python FastAPI rag-service scaffold (uvicorn, FastAPI, pydantic)
3. Initialize Next.js frontend scaffold (create-next-app with TypeScript and Tailwind)
4. Set up pnpm workspace root with package.json referencing all three services
5. Create .env.example with all environment variable names (no secrets)
6. Set up Docker Compose with PostgreSQL, Redis, Qdrant, MinIO (local S3), Ollama
7. Configure ESLint + Prettier + TypeScript strict mode for all three services
8. Configure pre-commit hooks (husky + lint-staged / pre-commit)
9. Set up GitHub Actions CI pipeline (lint + type-check + unit test for all services)
10. Verify end-to-end: docker-compose up, all services healthy, frontend loads

### Deliverables

- GitHub repo with all three services scaffolded
- Working docker-compose.yml for local dev
- GitHub Actions CI pipeline running on PR
- All services healthy and communicating locally

---

## Sprint 1: Auth, Tenants, Users (Week 1, 5 days)

**Goal:** Core SaaS authentication and tenant management working end-to-end.

### References

- Chapter 1: Project Kickoff (vision, goals, scope)
- Chapter 2: Requirements (functional reqs FR-001, FR-002, BR-001, BR-002)
- Chapter 7: API Design (auth endpoints, JWT, RBAC)
- Chapter 9: Backend Foundation (NestJS auth module, guards, Passport)

### Tasks

#### Backend (NestJS)

1. Auth module: signup endpoint (creates tenant + admin user)
2. Auth module: login endpoint (JWT access + refresh tokens, HTTP-only cookies)
3. Auth module: refresh token endpoint
4. Auth module: logout endpoint (invalidate refresh token)
5. Auth module: password reset flow (forgot password, reset password)
6. Users module: GET /users/me (current user profile)
7. Users module: PATCH /users/me (update display name, change password)
8. Tenants module: GET /tenants/me (current tenant profile)
9. Tenants module: PATCH /tenants/me (update tenant settings)
10. Tenants module: POST /tenants/me/invitations (invite user by email)
11. Tenants module: POST /tenants/me/invitations/:token/accept (accept invite)
12. Tenants module: GET /tenants/me/members (list members with roles)
13. Tenants module: PATCH /tenants/me/members/:userId (change role)
14. Tenants module: DELETE /tenants/me/members/:userId (remove member)
15. Prisma schema for Tenant, User, Invitation, AuditLog models with migrations
16. Tenant scoping middleware: extracts tenant_id from JWT, attaches to request
17. Global error filter: standardized error responses
18. Global request logging middleware (method, path, status, duration, tenant_id)
19. API documentation via Swagger (/docs) with all auth endpoints documented

#### Python RAG Microservice

20. FastAPI scaffold with health check endpoint (GET /health)
21. Pydantic config module (reads env vars, validates at startup)
22. Basic main.py with /health endpoint returning 200 OK

#### Frontend (Next.js)

23. Auth page: Login form with email + password
24. Auth page: Signup form (tenant name, admin email, password)
25. Auth page: Invite acceptance page (/invite/accept/:token)
26. Next.js middleware: JWT validation, protected route redirect to /login
27. Zustand auth store: user info, JWT tokens, tenant context
28. React Query setup with base API client (axios/fetch with JWT interceptor)
29. Toast notification system for auth feedback
30. Responsive navigation with role-aware menu items

### Tests

- Unit: Auth controller (signup, login, refresh, logout logic)
- Integration: Full signup flow (create tenant + user, login, access protected route)
- Integration: Login with wrong password returns 401
- Integration: Expired token refreshed via refresh endpoint
- Integration: End user cannot access admin-only endpoint (403)
- E2E (Playwright): Signup -> login -> dashboard redirect -> logout

### Exit Criteria

- New tenant can sign up and log in
- Tenant admin invited users can accept invite and log in
- JWT access token expires after 15 minutes, refresh works
- Tenant isolation enforced at API level (tenant A cannot access tenant B data)
- Swagger docs accessible and accurate
- All auth endpoints tested (unit + integration)

---

## Sprint 2: Documents + RAG Pipeline (Week 2, 5 days)

**Goal:** Document upload, parsing, chunking, embedding, and vector search working end-to-end.

### References

- Chapter 3: Domain Model (Document, Chunk, Embedding entities)
- Chapter 5: Solution Architecture (document processing flow)
- Chapter 6: Data Design (document/chunk/embedding schemas)
- Chapter 7: API Design (document and search endpoints)
- Chapter 8: Core Backend Modules (Documents module, Search module)

### Tasks

#### Backend (NestJS)

1. Documents module: POST /documents/upload (multipart file upload)
2. Documents module: File validation (type: PDF/DOCX/TXT, size: max 50MB)
3. Documents module: S3 upload via presigned URL (Oracle Object Storage)
4. Documents module: Create document record with status uploaded
5. Documents module: Push document_processing job to Redis/BullMQ queue
6. Documents module: GET /documents (list tenant documents with pagination)
7. Documents module: GET /documents/:id (document details and status)
8. Documents module: DELETE /documents/:id (archive, cascade to S3 + Qdrant + chunks)
9. Documents module: POST /documents/:id/reprocess (re-chunk, re-embed, re-index)
10. Search module: POST /search (forward query to Python RAG microservice)
11. Search module: Query validation (non-empty, max 1000 chars)
12. Search module: Caching identical queries (5-min TTL)
13. Search module: Store query + answer in Conversations service
14. Search module: Circuit breaker for RAG microservice calls
15. Conversations module: GET /conversations (list tenant conversations)
16. Conversations module: POST /conversations (create session)
17. Conversations module: GET /conversations/:id (messages with citations)
18. Conversations module: DELETE /conversations/:id (cascade delete)
19. API Keys module: GET/POST/DELETE /api-keys (tenant-scoped keys)

#### Python RAG Microservice

20. PDF parser: Extract text from PDF files (PyMuPDF or pdfplumber)
21. DOCX parser: Extract text from DOCX files (python-docx)
22. TXT parser: Read plain text files
23. Text splitter: Split documents into 512-token chunks with 50-token overlap
24. Embedding generator: Call Google Gemini embedding API for each chunk
25. Qdrant indexer: Store chunk embeddings in tenant namespace
26. Search handler: Embed user query, search Qdrant by tenant namespace, return top-K chunks
27. LLM answer generator: Call Google Gemini with retrieved chunks as context
28. Source citation formatter: Return document names + chunk previews with answers
29. Document processing queue consumer: Process jobs from Redis queue
30. Document status updater: Set status to processing -> indexed or failed
31. Health check: GET /health returns status of Qdrant connection, Gemini API, Redis

#### Frontend (Next.js)

32. Documents page: List with status badges, upload button, search/filter
33. Upload component: Drag-and-drop zone with progress bar, type/size validation
34. Document detail page: Shows processing status, error messages if failed
35. Search page: Query input, loading state, answer display with source citations
36. Conversation page: List of past queries with responses
37. API Keys page: Create/list/revoke keys, show full key once
38. Real-time processing status polling (GET /documents/:id/stream)

### Tests

- Unit: PDF parser (valid PDF, corrupted PDF, empty PDF)
- Unit: Text splitter (various chunk sizes, overlap behavior)
- Unit: Embedding generator (called with correct params, handles API errors)
- Unit: Search handler (returns relevant chunks, tenant-scoped)
- Unit: LLM answer generator (returns grounded answer, includes citations)
- Integration: Upload PDF -> wait for processing -> search returns answer with citations
- Integration: Search with no matching chunks returns no answer found
- Integration: Delete document -> Qdrant embeddings removed, S3 file removed
- Integration: Reprocess document -> old chunks deleted, new chunks indexed
- Integration: Cross-tenant Qdrant isolation (tenant A queries return zero tenant B results)
- E2E: Upload document -> wait for indexed -> search -> cite sources -> view in conversation history
- Performance: Search response under 2 seconds for 1000-chunk document
- Performance: Document processing under 30 seconds per standard PDF

### Exit Criteria

- Tenant can upload PDF/DOCX/TXT files
- Files are parsed, chunked, embedded, and indexed in Qdrant
- Natural language search returns grounded answers with source citations
- Search responses include document links and chunk previews
- Tenant isolation enforced at Qdrant namespace level
- Document delete cascades to S3 + Qdrant + PostgreSQL
- All endpoints tested (unit + integration)

---

## Sprint 3: Frontend Polish + Administration (Week 3, 5 days)

**Goal:** Complete UI with all pages, responsive design, accessibility, and admin panel.

### References

- Chapter 9: Frontend Development (component architecture, responsive design)
- Chapter 10: Core Backend Modules (frontend-facing modules)

### Tasks

#### Backend (NestJS)

1. Notifications module: Send email on tenant invites (SMTP integration)
2. Notifications module: Send email on document processing completion
3. Notifications module: Send email on document expiry alerts
4. Health module: GET /health with dependency status (PostgreSQL, Qdrant, Redis, Gmail SMTP)
5. Platform admin module: GET /platform/tenants (list all tenants for platform admin)
6. Platform admin module: GET /platform/tenants/:id/health (tenant health status)
7. Rate limiting: per-tenant general (100 req/min), search (30 req/min), upload (10/hour)

#### Frontend (Next.js)

8. Dashboard page: Tenant overview (document count, recent activity, storage usage)
9. Settings page: Tenant configuration (chunk size, embedding model preferences)
10. Team page: Member list with roles, invite button, remove button
11. Invitation management: View pending invites, resend, revoke
12. Profile page: Update display name, change password
13. 404 page: Custom not-found with navigation back to dashboard
14. Unauthorized page: Permission denied with role explanation
15. Loading skeletons for all data-fetching pages
16. Empty states for documents list, conversations list, API keys list
17. Error boundaries for all page components
18. Responsive design verification (desktop, tablet, mobile breakpoints)
19. Accessibility audit: keyboard navigation, ARIA labels, color contrast, focus management
20. Toast notification system for all user actions (success, error, info)
21. Confirm dialogs for destructive actions (delete document, remove member, revoke API key)

### Tests

- Unit: Every UI component renders correctly with props
- Unit: Auth middleware redirects unauthenticated users to /login
- Integration: Full signup -> login -> dashboard -> upload -> search -> conversation flow
- Integration: Token refresh works mid-session, no login interruption
- Integration: Logout clears tokens, redirects to login, blocks subsequent API calls
- Integration: Tenant A user cannot see Tenant B documents (403 on tampered requests)
- Integration: End user cannot access admin-only endpoints (403)
- Manual: Cross-browser testing (Chrome, Firefox, Edge, Safari)
- Manual: Responsive testing on mobile, tablet, and desktop viewports
- Manual: Keyboard-only navigation through all pages
- Manual: Screen reader testing (NVDA or VoiceOver)
- Manual: Color contrast verification (min 4.5:1 for text)

### Exit Criteria

- All pages implemented and functional
- Upload -> process -> search -> conversation workflow complete end-to-end
- Responsive design verified on all breakpoints
- Accessibility audit passed (WCAG 2.1 AA)
- Admin panel (team, settings, API keys) fully functional
- All error states handled (404, 401, 403, 500, network errors)
- Loading and empty states handled on every page

---

## Sprint 4: Hardening, Testing & Release (Week 4, 5 days)

**Goal:** Production-ready with full test coverage, security verified, and deployment configured.

### References

- Chapter 10: Testing & QA (test strategy, test cases, QA gates)
- Chapter 11: Deployment & DevOps (Infrastructure, CI/CD, monitoring)

### Tasks

#### Testing (QA)

1. Write all 18 test cases from Chapter 10 (TC-001 through TC-018)
2. Run all test cases against staging environment
3. Cross-tenant isolation verification (manual + automated)
4. Performance benchmark: auth under 500ms p95, search under 2s p95
5. Security testing: auth bypass attempts, tenant ID spoofing, prompt injection
6. Load testing: 10 concurrent users per tenant, verify no data leakage
7. Accessibility regression testing
8. Generate QA test report with pass/fail status for all 18 cases
9. Fix all critical and high severity bugs found during testing

#### DevOps & Deployment

10. Set up Oracle Cloud Always Free Tier VM (2 ARM instances)
11. Configure Oracle Cloud Object Storage bucket for document storage
12. Set up Qdrant on Oracle VM with tenant namespace isolation
13. Configure PostgreSQL on Oracle VM or Neon free tier
14. Configure Redis (Upstash free tier) for BullMQ job queue
15. Build Docker images for NestJS backend and Python RAG microservice
16. Push images to GitHub Container Registry
17. Configure Vercel for frontend deployment (production branch)
18. Set up Cloudflare DNS with SSL (or Oracle Cloud Load Balancer)
19. Configure GitHub Actions CI/CD: lint -> test -> build -> deploy to staging
20. Add staging smoke test step in CI/CD pipeline
21. Set up Sentry for error tracking (free tier, 5K events/month)
22. Configure Oracle Cloud monitoring and alerting
23. Verify database backup procedure (daily automated + manual restore test)
24. Verify S3 object storage versioning and retention
25. Document production deployment checklist
26. Configure environment-specific secrets (Oracle Vault, GitHub Secrets, Vercel env vars)
27. Set up rate limiting dashboards and LLM cost monitoring alerts
28. Penetration testing of production deployment

#### Documentation

29. Update README.md with accurate setup instructions
30. Update PROJECT-PLAN.md with final decisions and service choices
31. Write deployment runbook (how to deploy, rollback, troubleshoot)
32. Write security checklist for production (HTTPS, secrets, firewall, access review)
33. Final review of all docs in docs/ folder for completeness

### Tests (Production Readiness)

- E2E: Fresh deployment from scratch, all services come up healthy
- E2E: Tenant signup -> upload PDF -> search -> get answer (full production flow)
- E2E: RAG pipeline handles 50MB PDF without timeout or OOM
- E2E: Concurrent 100 tenants on single deployment, no cross-tenant leakage
- Monitoring: All alerts fire correctly on simulated failures
- Backup: Database restore from latest snapshot verified
- Security: No exposed secrets, no open ports except 443, all IAM roles least-privilege

### Exit Criteria

- All 18 test cases pass
- Critical and high severity bugs are zero
- Cross-tenant isolation verified (zero leakage)
- Performance benchmarks met (auth <500ms, search <2s)
- Production deployment verified on Oracle Cloud
- All monitoring and alerting active
- Backup and recovery procedure tested
- Security scan clean (no critical vulnerabilities)
- Client demo ready and accepted

---

## Timeline Summary

| Sprint | Week | Goal | Status |
|--------|------|------|--------|
| Sprint 0 | Week 0 | Dev environment, scaffolding, CI/CD | Pending |
| Sprint 1 | Week 1 | Auth, Tenants, Users working end-to-end | Pending |
| Sprint 2 | Week 2 | Document upload + RAG pipeline working end-to-end | Pending |
| Sprint 3 | Week 3 | Complete frontend UI with all pages and admin | Pending |
| Sprint 4 | Week 4 | Hardening, testing, security, production deployment | Pending |

---

## Risk Buffer

Each sprint has a 1-day buffer for unexpected issues. If a sprint runs over, the remaining sprints can compress by 1 day each. The total timeline remains 4 weeks with buffer included.

---

# End of Sprint Plan
