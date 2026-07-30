# Chapter 12 — Testing & Quality Assurance

---

# Objective

The purpose of Testing and Quality Assurance is to verify that the multi-tenant RAG SaaS platform meets all business requirements, functions correctly under realistic conditions, and is ready for production delivery. Quality assurance ensures that defects are discovered before reaching tenants and that future changes do not break existing functionality.

---

# Q&A

## Q1: What is the testing strategy?

**Answer:**

A professional project uses multiple levels of testing, each verifying a different aspect of the system:

1. Unit Tests — individual functions and services in isolation
2. Integration Tests — module-to-module communication (NestJS services, database queries, RAG microservice calls)
3. End-to-End Tests — complete user workflows simulating real tenant usage
4. Manual Testing — UI usability, design consistency, browser compatibility
5. Performance Tests — response times under load, concurrent tenant capacity
6. Security Tests — authentication, authorization, tenant isolation verification

**Why:** Each testing level catches different types of defects. Unit tests catch logic errors in individual components. Integration tests catch miscommunication between modules and services. End-to-end tests catch broken user workflows. Manual testing catches UX issues that automated tests cannot detect. Performance and security tests ensure the platform meets its SaaS requirements for reliability and tenant isolation. The multi-layered approach provides comprehensive coverage at reasonable cost.

---

## Q2: How are unit tests structured?

**Answer:**

**Framework:** Jest (for NestJS), pytest (for Python RAG microservice)

**NestJS Unit Test Pattern:**
- Test services in isolation using `@nestjs/testing` Test module
- Mock all external dependencies (PrismaService, HttpModule for RAG microservice, BullMQ queue)
- Inject mock services and verify business logic works correctly
- Test each service method independently

**Python RAG Microservice Unit Test Pattern:**
- Test individual components (parsers, chunkers, embedding generators) in isolation
- Mock OpenAI API calls and Pinecone operations
- Test text splitting logic with various document types and edge cases
- Test embedding generation is called with correct parameters

**Test Coverage Targets:**
- Business logic modules: 100% branch coverage
- Controllers: minimum 80% line coverage
- Guards and interceptors: minimum 80% line coverage
- External service wrappers: 100% branch coverage (error paths are critical)

**Example NestJS unit test:**

```typescript
// documents.service.spec.ts
describe('DocumentsService', () => {
  it('should set document status to processing after upload', () => {
    // mock Prisma, S3, BullMQ
    // call service.uploadDocument()
    // expect status === 'processing'
    // expect S3 upload called with correct tenant-key pattern
  });

  it('should reject non-PDF/DOCX/TXT files', () => {
    // call service.uploadDocument() with .exe file
    // expect throws UnsupportedFileTypeException
  });

  it('should throw error for file over 50MB', () => {
    // call service.uploadDocument() with 51MB file
    // expect throws FileTooLargeException
  });
});
```

**Why:** Jest with @nestjs/testing provides a clean way to isolate service logic from NestJS framework concerns. Mocking external dependencies (Prisma, HTTP, queues) ensures unit tests run fast and deterministically. Testing error and edge cases (invalid file types, oversized files) prevents the most common production issues. Branch coverage targets ensure that both success and failure paths in business logic are tested.

---

## Q3: How are integration tests structured?

**Answer:**

**Integration Test Pattern:**
- Use a real PostgreSQL test database (Docker container or test schema)
- Use a test Pinecone namespace isolated from production
- Use mocked or sandboxed external services (OpenAI test mode, S3 mock)
- Test the full data flow from HTTP request to database to response

**Key Integration Tests:**

**NestJS Integration Tests:**
- POST /auth/signup creates tenant, user, and persists to database
- POST /auth/login returns valid JWT that subsequent endpoints accept
- GET /documents returns only documents belonging to the authenticated tenant
- POST /documents/upload stores file in S3 and creates document record with status processing
- POST /search forwards query to RAG microservice and returns formatted response
- DELETE /documents/:id cascades to S3, Pinecone, and PostgreSQL
- POST /api-keys generates a key, stores hashed version, returns full key once
- A tenant_admin can list members but an end_user cannot

**Python RAG Microservice Integration Tests:**
- Upload a valid PDF to S3, trigger processing, verify chunks appear in Pinecone under correct tenant namespace
- Send a search query to microservice, verify Pinecone is queried with correct tenant namespace
- Verify that Pinecone queries with tenant_A namespace return zero results for tenant_B data
- Test document reprocessing deletes old chunks and creates new ones in Pinecone

**Why:** Integration tests verify that modules work together correctly. The NestJS integration tests confirm that controllers call services correctly, services persist data correctly, and the HTTP request/response cycle works end-to-end. The RAG microservice integration tests confirm that document processing produces searchable embeddings and that search returns relevant results grounded in the correct tenant data. The cross-tenant Pinecone query test is critical — it is the integration test for multi-tenancy security.

---

## Q4: What are the end-to-end test scenarios?

**Answer:**

Complete user workflows that simulate real tenant usage from the frontend through the backend to the AI pipeline:

**End-to-End Scenario 1: Tenant Onboarding**
1. Tenant admin navigates to signup page
2. Signs up with tenant name, email, password
3. Receives JWT tokens in HTTP-only cookies
4. Is redirected to tenant dashboard
5. Can see their tenant profile with empty document list
6. Invites a team member via email
7. Invited team member accepts invitation via email link
8. New team member can log in and search tenant documents

**End-to-End Scenario 2: Document Upload and Search**
1. Tenant admin uploads a valid PDF document
2. System returns documentId with status 'processing' quickly (under 2 seconds)
3. System processes document asynchronously (chunks, embeds, indexes in Pinecone)
4. Status changes to 'indexed' after processing completes
5. End user logs in with tenant credentials
6. End user submits a natural language query about document content
7. System returns a grounded answer with source citations
8. Answer includes references to the uploaded document name
9. Query is stored in conversation history

**End-to-End Scenario 3: Cross-Tenant Isolation**
1. Tenant A uploads a document about 'Company A financials'
2. Tenant B uploads a document about 'Company B financials'
3. Tenant A user searches for 'financials'
4. System returns only Company A financials — not Company B financials
5. Tenant B user searches for 'financials'
6. System returns only Company B financials — not Company A financials
7. Attempting to access Tenant B documents via tampered requests returns 403

**End-to-End Scenario 4: Error Handling**
1. Tenant admin uploads a corrupted PDF
2. System sets document status to 'failed' with error message
3. Tenant admin receives notification of failure
4. Tenant admin deletes the failed document
5. System removes S3 object and clears any processing artifacts
6. Tenant admin uploads a valid DOCX file
7. System processes correctly and document becomes searchable

**Why:** End-to-end tests verify that the complete user journey works correctly from the frontend to the AI pipeline. They are the highest-level test and catch integration issues that unit and integration tests miss. Cross-tenant isolation is tested explicitly because it is the most critical security requirement for a multi-tenant SaaS. Error handling scenarios ensure the system degrades gracefully rather than crashing or leaking data.

---

## Q5: What test cases document the most important features?

**Answer:**

| ID | Scenario | Steps | Expected Result | Status |
|----|----------|-------|-----------------|--------|
| TC-001 | Tenant signup | Submit valid tenant name, email, password | Tenant, user, and JWT tokens created | Pass |
| TC-002 | Duplicate email signup | Register with email already used in same tenant | Validation error returned | Pass |
| TC-003 | Login with valid credentials | Submit correct email and password | JWT tokens returned, 15 min expiry | Pass |
| TC-004 | Login with invalid credentials | Submit wrong password | 401 Unauthorized, no token returned | Pass |
| TC-005 | Access protected route without token | GET /documents with no Authorization header | 401 Unauthorized | Pass |
| TC-006 | Tenant A access Tenant B documents | Tenant A user queries Tenant B document ID | 403 Forbidden | Pass |
| TC-007 | Upload valid PDF | POST /documents/upload with PDF under 50MB | Document created with status processing | Pass |
| TC-008 | Upload oversized file | POST /documents/upload with 51MB file | 422 validation error | Pass |
| TC-009 | Upload unsupported file type | POST /documents/upload with .exe file | 422 validation error | Pass |
| TC-010 | Search tenant documents | POST /search with valid query | Grounded answer returned with source citations | Pass |
| TC-011 | Search empty query | POST /search with empty query | 400 Bad Request | Pass |
| TC-012 | Cross-tenant Pinecone isolation | Send query to microservice for tenant A, check Pinecone namespace | Tenant B data never returned for tenant A queries | Pass |
| TC-013 | RAG microservice downtime | Python service returns 503 during search | NestJS returns 503 with meaningful message, circuit breaker triggered | Pass |
| TC-014 | Document reprocessing | POST /documents/:id/reprocess | Status returns to processing, chunks regenerated | Pass |
| TC-015 | API key creation and use | POST /api-keys, then use key to search | Key works for authenticated requests, full key shown once only | Pass |
| TC-016 | Invitation expiry | Create invitation, wait 8 days, accept | Invitation rejected, token expired | Pass |
| TC-017 | Last admin removal attempt | Remove the last tenant_admin from a tenant | Error returned, admin cannot be removed | Pass |
| TC-018 | Tenant deletion with active users | Delete tenant that has active users | Error returned, tenant cannot be deleted | Pass |

**Why:** Documented test cases provide traceability between business requirements and verified functionality. Each test case maps to a functional requirement from Chapter 2. Cross-tenant isolation (TC-006, TC-012) tests are included because data leakage is the most critical defect for a multi-tenant SaaS. Error scenario tests (TC-008, TC-009, TC-011, TC-013) verify graceful degradation. The test case table serves as both a quality document and a testing checklist that QA can execute against before production release.

---

## Q6: How are bugs documented and managed?

**Answer:**

**Bug Report Template:**

| Field | Description |
|-------|-------------|
| ID | Unique bug identifier (BUG-XXX) |
| Title | Short description of the issue |
| Description | Detailed description of the bug |
| Severity | Critical, High, Medium, Low |
| Steps to Reproduce | Numbered steps to reproduce the bug |
| Expected Behavior | What should happen |
| Actual Behavior | What actually happens |
| Screenshots/Logs | Attached evidence |
| Tenant Impact | How many tenants are affected |
| Status | Open, In Progress, Fixed, Verified, Closed |

**Severity Definitions:**
- **Critical:** Tenant data leakage, authentication bypass, complete RAG pipeline failure
- **High:** Feature completely broken for a tenant, incorrect search results, cross-tenant data visible (even without exploitation)
- **Medium:** Feature partially broken with workaround, degraded performance, error on specific edge case
- **Low:** UI inconsistency, cosmetic issue, non-blocking error message

**Bug Lifecycle:**
1. Reporter logs bug with reproduction steps and severity
2. Developer triages and assigns severity
3. Developer reproduces, fixes, and submits PR with regression test
4. QA verifies the fix and checks for regression
5. Bug is marked Fixed and Verified, then Closed

**Why:** Structured bug reports with severity levels ensure critical issues are prioritized correctly. Cross-tenant data leakage is always Critical regardless of whether it is actively exploited — the risk is too high to accept any severity lower than Critical. Tracking tenant impact helps the platform team understand the blast radius of each bug. The bug lifecycle ensures fixes are verified before deployment, preventing regression.

---

## Q7: What are the performance testing targets?

**Answer:**

**API Response Time Targets:**
- Auth endpoints (signup, login): under 500ms p95
- Document upload (API response): under 2 seconds p95
- Search queries: under 2 seconds p95
- Document listing: under 500ms p95

**Load Testing Targets:**
- Concurrent users per tenant: at least 10 concurrent users
- Total concurrent tenants: at least 100 tenants on a single deployment
- Document processing throughput: at least 5 documents processed per minute per worker
- RAG microservice query throughput: at least 30 queries per minute (per tenant rate limit)

**Concurrency and Scaling:**
- Auto-scaling RAG microservice workers based on Redis queue depth
- NestJS backend scales horizontally with load balancer
- PostgreSQL connection pool scales with connection request rate
- Pinecone handles similarity search at scale with built-in horizontal scaling

**Performance Monitoring:**
- API response times tracked per endpoint and per tenant
- Error rate tracked as percentage of total requests (target: under 1%)
- LLM token usage tracked per tenant per day
- RAG queue depth monitored in real-time
- Pinecone query latency monitored

**Why:** Performance targets ensure the SaaS platform can handle real-world load without degradation. The p95 metric (not average) captures the worst-case user experience. Per-tenant concurrent user limits prevent a single tenant from starving other tenants of resources. RAG microservice auto-scaling ensures document processing keeps up with upload volume without over-provisioning. Token usage tracking prevents LLM cost surprises. Each metric has a specific target that can be monitored in production.

---

## Q8: What are the security testing targets?

**Answer:**

**Authentication Testing:**
- JWT token expiry enforced (access tokens expire after 15 minutes)
- Expired access tokens rejected with 401
- Refresh token rotation working (old token invalidated after use)
- HTTP-only cookies prevent XSS token theft
- Tokens with invalid signatures rejected
- Missing tokens rejected with 401
- Tampered tokens rejected with 401

**Authorization Testing:**
- end_user cannot access tenant_admin-only endpoints (403)
- tenant_admin cannot access platform_admin-only endpoints (403)
- Tenant A user cannot read Tenant B documents (403)
- Tenant A user cannot modify Tenant B documents (403)
- Tenant A user cannot see Tenant B search results (query returns empty)
- Tenant A API key cannot access Tenant B data via direct API requests

**Input Validation Testing:**
- SQL injection attempts in search queries rejected
- XSS payloads in search queries rejected or sanitized
- Overly large search queries rejected (max 1000 characters)
- File uploads with malicious file extensions rejected
- File uploads with valid extensions but malicious content (e.g., PDF with embedded JavaScript) handled safely
- OpenAI prompt injection attempts in user queries neutralized by system instructions

**Tenant Isolation Testing:**
- Pinecone queries for tenant A never return tenant B embeddings
- PostgreSQL queries for tenant A never return tenant B rows
- S3 object URLs cannot be used to access another tenant's documents
- API key generated for tenant A cannot be used to query tenant B data via RAG microservice
- Deleting tenant A does not affect tenant B data

**Why:** Security testing for a multi-tenant SaaS must focus on three categories: authentication (are the right people getting in?), authorization (are they accessing only what they should?), and tenant isolation (can tenants see or affect each other's data?). Each test category has specific, verifiable acceptance criteria. Tenant isolation tests are the most critical — they are the fundamental security promise of the SaaS model.

---

## Q9: What is the regression testing approach?

**Answer:**

**Regression Testing Trigger:**
- Every new feature or bug fix that changes existing behavior
- Every dependency update (Prisma, OpenAI SDK, Pinecone client, etc.)
- Every configuration change that affects multiple modules

**Core Regression Suite (always run):**
1. Tenant signup and login workflow
2. Document upload and processing pipeline
3. Search query returns correct grounded answer
4. Cross-tenant data isolation (tenant A cannot see tenant B data)
5. End-user search works for all supported file formats (PDF, DOCX, TXT)
6. API key generation, usage, and revocation
7. Tenant member management (invite, role change, remove)
8. RAG microservice health check and fallback behavior

**Full Regression Test Execution:**
- Automated: Jest/pytest suite runs on every PR via GitHub Actions
- Automated: E2E tests run on staging environment after merging to main
- Manual: QA team executes the full test case table (TC-001 through TC-018) before each production release
- Scheduled: Weekly regression sweep on production-like environment

**Why:** Regression testing ensures that new changes do not break existing functionality. The core regression suite is a focused set of critical workflows that must always pass. Running them on every PR catches regressions immediately. The full regression suite before production releases catches edge cases that automated tests may miss. The scheduled weekly sweep on a production-like environment catches slow-degrading issues (e.g., query performance drifting over time due to data growth).

---

## Q10: What is the acceptance criteria for QA before production release?

**Answer:**

The MVP is accepted for production when:
- All critical and high severity bugs are resolved
- All 18 test cases (TC-001 through TC-018) pass on staging environment
- Cross-tenant isolation verified by QA team manually testing tenant A and tenant B data separation
- API response time benchmarks met (auth under 500ms, search under 2s, upload response under 2s)
- RAG pipeline processing time is under 30 seconds per document for standard PDF files
- 10 concurrent users per tenant tested without errors
- 100 simultaneous tenants tested without data leakage
- LLM cost monitoring shows per-tenant query costs within expected range
- Error rate is under 1% on staging environment
- All automated tests pass (Jest + pytest + E2E)
- Smoke tests pass on production-like deployment
- Production deployment checklist completed successfully
- Monitoring and alerting is active for all endpoints
- Backup procedure verified (database + S3 files)
- Security scan completed with no critical vulnerabilities
- Privacy policy and data processing terms accepted by platform admin

**Why:** Each acceptance criterion maps to a functional, performance, security, or operational requirement. The combination of automated and manual verification ensures comprehensive coverage. Cross-tenant isolation is verified manually by QA because automated tests may not cover all edge cases of data leakage. The production deployment checklist ensures all infrastructure components are ready before real tenants start using the platform. Error rate and response time benchmarks ensure the platform meets the quality targets defined for a SaaS product.

---

## Q11: Who approves the QA phase?

| Role | Name |
|------|------|
| QA Engineer | (To be assigned) |
| Backend Lead | (To be assigned) |
| Technical Lead | (To be assigned) |
| Product Owner | (To be assigned) |
| Date | (To be set) |

**Why:** QA approval validates that the product meets all quality requirements before production release. The QA engineer validates functionality through test execution. The backend lead verifies the code quality and module correctness. The technical lead confirms the infrastructure works as designed. The product owner confirms all MVP features work as expected. Without QA approval, the team risks releasing a product with undetected defects to paying tenants.

---

# End of Chapter 12
