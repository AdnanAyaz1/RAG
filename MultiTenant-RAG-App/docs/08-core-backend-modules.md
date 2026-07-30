# Chapter 10 — Core Backend Modules

---

# Objective

The purpose of this chapter is to implement the core business logic for the multi-tenant RAG SaaS platform. The NestJS backend handles auth, tenant management, and document operations, while the Python RAG microservice handles document processing and AI-powered search. Each module follows NestJS conventions with clear separation of concerns.

---

# Q&A

## Q1: What are the backend modules?

**Answer:**

| Module | Responsibility | Priority |
|--------|---------------|----------|
| Auth | Signup, login, JWT validation, password reset | 1 (Foundational) |
| Users | User management, role assignment | 2 (Foundational) |
| Tenants | Tenant CRUD, membership, invitations | 2 (Foundational) |
| Documents | Upload, list, delete, reprocess, status tracking | 3 (Core) |
| Search | Submit queries to RAG microservice, return answers | 4 (Core) |
| Conversations | Chat sessions, query history | 5 (Core) |
| API Keys | Generate, list, revoke tenant API keys | 5 (Core) |
| Notifications | Email for invites, processing status, expiry alerts | 6 (Supporting) |
| Health | System health checks, dependency status | 6 (Supporting) |

**Why:** Modules are ordered by dependency chain. Auth must exist first -- every request requires it. Users and Tenants are the SaaS foundation -- without them there are no organizations. Documents enables the primary RAG workflow. Search depends on Documents for document status checking. Conversations depends on Search. Supporting modules (Notifications, Health, API Keys) come last as they build on existing infrastructure.

---

## Q2: What is the module structure for each NestJS module?

**Answer:**

Each NestJS module follows this structure:

```
modules/{module-name}/
  {module-name}.module.ts      <-- Module definition, imports, exports
  {module-name}.controller.ts   <-- HTTP endpoints (thin only)
  {module-name}.service.ts      <-- Business logic (thick)
  {module-name}.dto.ts          <-- Request/response validation schemas
  {module-name}.types.ts        <-- TypeScript interfaces
  {module-name}.guards/         <-- Auth and role guards
  {module-name}.interceptors/    <-- Module-specific response formatting
  {module-name}.exception-filters/ <-- Module-specific exception classes
  {module-name}.spec.ts         <-- Unit and integration tests
```

**Why:** This structure enforces separation of concerns. The controller only handles HTTP concerns (extract request, call service, format response). The service owns all business rules. DTOs define request/response contracts. Guards enforce authorization. Tests co-locate with implementation.

---

## Q3: How is the Auth module implemented?

**Answer:**

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /auth/signup | Create tenant + admin user |
| POST | /auth/login | Authenticate, return JWT tokens |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Invalidate refresh token |
| POST | /auth/forgot-password | Send reset email |
| POST | /auth/reset-password | Reset password with token |

**Service Responsibilities:**
- Hash passwords with bcrypt (12 rounds) before storage
- Create JWT access tokens (15 min expiry) and refresh tokens (7 day expiry)
- Validate tokens on every authenticated request
- Rotate refresh tokens (old token invalidated on each refresh)
- Handle password reset with time-limited tokens

**Guards:**
- `JwtAuthGuard` -- validates Bearer token on all protected endpoints
- `LocalAuthGuard` (Passport) -- validates email+password on /auth/login

**DTOs:** SignupDto, LoginDto, RefreshTokenDto, ResetPasswordDto

**Why:** Auth is foundational. NestJS Passport provides a clean strategy pattern that supports extending with OAuth or API key auth later. bcrypt with 12 rounds is the standard. Refresh token rotation limits the window for token theft.

---

## Q4: How is the Users module implemented?

**Answer:**

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /users/me | Get current user profile |
| PATCH | /users/me | Update display name or change password |
| GET | /tenants/:tenantId/users | List users in tenant (admin only) |
| DELETE | /tenants/:tenantId/users/:userId | Remove user from tenant |
| POST | /tenants/:tenantId/users/:userId/invite | Resend invitation |

**Service Responsibilities:**
- Validate all queries are tenant-scoped (user must belong to tenant)
- Hash new passwords with bcrypt before storage
- Prevent removal of the last admin in a tenant
- Validate email uniqueness within tenant scope
- Return only tenant-scoped user data in list responses

**Why:** Tenant isolation on every user operation prevents cross-tenant data access. The last-admin check prevents orphaned tenants. Per-tenant email uniqueness allows the same email across different tenants.

---

## Q5: How is the Tenants module implemented?

**Answer:**

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /tenants/me | Get current tenant profile |
| PATCH | /tenants/me | Update tenant settings |
| GET | /tenants/me/members | List tenant members |
| POST | /tenants/me/invitations | Invite user by email |
| POST | /tenants/me/invitations/:token/accept | Accept invitation |

**Service Responsibilities:**
- Generate cryptographically secure, time-limited invitation tokens
- Ensure at least one admin always exists per tenant
- Enforce tenant ownership before any modification
- Manage tenant settings as JSONB (chunk size, embedding model choice)
- Prevent removal of users with active data

**Guards:**
- `TenantAdminGuard` -- restricts management endpoints to tenant_admin role only

**Why:** Invitation tokens with expirations prevent stale invites. At-least-one-admin prevents tenant lockout. JSONB settings provide configuration flexibility without schema migrations. TenantAdminGuard keeps controllers thin -- role checking flows through the guard and the controller only handles HTTP concerns.

---

## Q6: How is the Documents module implemented?

**Answer:**

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /documents | List documents for tenant |
| POST | /documents/upload | Upload a new document file |
| GET | /documents/:id | Get document details and status |
| DELETE | /documents/:id | Delete/archived a document |
| POST | /documents/:id/reprocess | Trigger reprocessing |

**Service Responsibilities:**
- Validate file type (PDF, DOCX, TXT) and size (max 50 MB) before acceptance
- Store file in S3 with key pattern `{tenant_id}/{document_id}/{filename}`
- Create PostgreSQL document record with status "uploaded"
- Push a document_processing job to BullMQ/Redis queue for async work
- Return immediate response with documentId and status "processing"
- On delete: cascade to S3 object, Pinecone embeddings, chunks in PostgreSQL
- On reprocess: set status to "processing", remove old artifacts, push new job

**DTOs:** UploadDocumentDto (file + tenantId from JWT), DocumentResponseDto

**Why:** Immediate response with processing status prevents API timeouts during large uploads and slow indexing. The S3 key pattern enforces tenant organization at storage level. The async processing queue keeps the main API responsive. Cascade delete prevents orphaned data in S3, Pinecone, and PostgreSQL.

---

## Q7: How is the Search module implemented?

**Answer:**

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /search | Submit natural language query, get grounded answer |
| GET | /search/history | List past queries and responses |

**Service Responsibilities:**
- Extract tenant_id and user_id from the validated JWT
- Validate query string (non-empty, max 1000 characters)
- Forward query to Python RAG microservice via HTTP POST
- The RAG microservice embeds the query, searches Pinecone (tenant namespace), retrieves chunks, calls OpenAI LLM, returns grounded answer with citations
- Transform microservice response into standard NestJS response format
- Cache identical queries per tenant (5-minute TTL) to reduce LLM costs
- Store the query in Conversations service for history
- Implement circuit breaker for RAG microservice calls
- Return 503 with meaningful message if RAG service is unavailable

**DTOs:** SearchQueryDto, SearchResponseDto, SearchHistoryDto

**Why:** Tenant isolation is enforced by passing tenant_id to the RAG microservice which uses it as the Pinecone namespace filter. Caching identical queries reduces LLM API costs significantly. The circuit breaker prevents cascading failures if the Python service goes down. All errors are transformed into standard NestJS error format by global exception filter.

---

## Q8: How is the Conversations module implemented?

**Answer:**

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /conversations | List all conversations for tenant |
| POST | /conversations | Create a new conversation |
| GET | /conversations/:id | Get conversation with all messages |
| DELETE | /conversations/:id | Delete conversation and messages |

**Service Responsibilities:**
- Every conversation belongs to exactly one tenant
- Auto-generate title from first user message
- Enforce tenant isolation on all list and detail queries
- Cascade delete: deleting a conversation removes all associated messages
- Store assistant messages with source_chunks array for citation display

**Why:** Conversations provide session-based interaction making the platform feel like a chat app. Auto-generated titles provide helpful defaults without requiring user input. Cascade delete prevents orphaned messages.

---

## Q9: How is the API Keys module implemented?

**Answer:**

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api-keys | List all API keys for tenant (masked) |
| POST | /api-keys | Create a new API key |
| DELETE | /api-keys/:id | Revoke an API key |

**Service Responsibilities:**
- Generate cryptographically secure 256-bit random API keys
- Store only first 8 characters in plaintext for identification
- Store full key hashed (SHA-256) for lookup during authenticated requests
- Return the full key only once on creation
- Enforce maximum 10 active API keys per tenant
- On revocation, mark key as inactive (soft delete) for audit trail
- Track lastUsedAt timestamp for monitoring

**Why:** Full key generation and one-time display follows the pattern used by Stripe and other SaaS platforms. Hashing prevents database compromise from exposing active API keys. The 10-key limit prevents indefinite accumulation. Soft delete preserves the audit trail.

---

## Q10: What is the NestJS module dependency graph?

**Answer:**

```
AuthModule --> (no dependencies, foundation)
UsersModule --> depends on AuthModule
TenantsModule --> depends on AuthModule, UsersModule
DocumentsModule --> depends on AuthModule, TenantsModule
SearchModule --> depends on AuthModule, TenantsModule, DocumentsModule, HttpModule (calls RAG microservice)
ConversationsModule --> depends on AuthModule, SearchModule, TenantsModule
ApiKeysModule --> depends on AuthModule, TenantsModule
NotificationsModule --> depends on AuthModule, TenantsModule
HealthModule --> (no dependencies, foundation)
```

**Why:** The dependency graph ensures correct initialization order and prevents circular dependencies. AuthModule has no dependencies because every other module requires authentication. SearchModule depends on DocumentsModule for status checking. HealthModule has no dependencies because it must be available at any time.

---

## Q11: What are the module-level risks?

**Answer:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tenant ID spoofing via JWT | Critical | JWT signed server-side; tenantId from claims only; integration tests for every query path |
| Document processing queue backlog | High | Monitor queue depth; auto-scale Python RAG workers; alert on threshold breach |
| RAG microservice downtime | High | Circuit breaker in NestJS; fallback cached responses; clear error messages to users |
| Orphaned S3 files after deletion | Medium | Lifecycle hook in Documents service that always cleans up S3 and Pinecone |
| Pinecone namespace confusion | Critical | Enforce namespace = tenant_id in Python service; cross-namespace integration tests |
| LLM cost overrun | High | Per-tenant query rate limiting; cost monitoring dashboard; daily cost alerts |
| Auth token leaks in logs | Critical | Never log Authorization headers; filter sensitive headers from request logging middleware |
| Cross-tenant data in list endpoints | Critical | All list endpoints use tenant_id from JWT in WHERE clause; integration tests verify isolation |
| Async processing user confusion | Medium | Real-time status polling endpoint; email notification when document is indexed |

**Why:** Tenant ID spoofing breaks the core multi-tenancy guarantee -- it is the highest priority risk. RAG microservice downtime affects the primary user feature directly. Each risk has a specific, testable mitigation rather than passive monitoring.

---

## Q12: Who approves the core backend modules?

| Role | Name |
|------|------|
| Backend Lead | (To be assigned) |
| Technical Lead | (To be assigned) |
| Date | (To be set) |

**Why:** Backend module approval ensures each module follows the established architectural patterns, enforces tenant isolation correctly, and is testable before deployment. Without approval, modules may be implemented inconsistently or miss critical security checks.

---

# End of Chapter 10
