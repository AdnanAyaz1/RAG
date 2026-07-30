# Chapter 07 — API Design

---

# Objective

The purpose of API Design is to define the communication contract between the client and the backend system. This document specifies the available endpoints, request formats, response structures, authentication requirements, validation rules, and error responses before implementation begins.

---

# Q&A

## Q1: What API style will we use?

**Answer:**

**API Style:** REST with JSON request/response bodies

**Reason:** REST is the most widely adopted API style, well-understood by frontend and backend developers alike. For an MVP with a Next.js frontend, REST is the simplest and most productive choice. GraphQL adds complexity without meaningful benefit for MVP scope.

**Why:** REST aligns with the team's velocity goals and the Next.js ecosystem expectations. JSON over HTTP is the universal standard for web APIs. The modular monolith architecture means one backend serving one frontend - REST is the right fit. API versioning with URI prefixes (/api/v1/) leaves the door open to future changes if the need arises.

---

## Q2: What are the base URL and version?

**Answer:**

**Base URL:** /api/v1
**Version:** v1

**Reason:** URI versioning is the simplest versioning strategy and the easiest to implement. It is transparent to clients and easy to debug. Future breaking changes will be introduced under /api/v2.

**Why:** API versioning is essential for a SaaS product where tenants may upgrade at different times. Without versioning, any change to an endpoint breaks all tenants simultaneously. URI versioning adds minimal overhead compared to header-based versioning.

---

## Q3: What are the primary API resources?

- Auth (signup, login, logout, token refresh)
- Tenants (tenant profile, settings, member management, invitations)
- Documents (upload, list, delete, reprocess, status check)
- Search (query, retrieve ranked results, chat/conversation)
- Conversations (list, create, delete, history)
- API Keys (create, list, revoke)
- Users (profile, password change, invitation acceptance)

**Why:** These resources map directly to the core user workflows identified in the domain model. Auth and Tenants are the foundation - every other resource requires a valid tenant context. Documents and Search are the core RAG features. Conversations enable the chat-like interaction pattern. API Keys support programmatic access for integrations.

---

## Q4: What are the endpoint definitions?

### Auth

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| POST /auth/signup | POST | Create a new tenant and admin user | No |
| POST /auth/login | POST | Authenticate and receive JWT tokens | No |
| POST /auth/refresh | POST | Refresh expired access token | No (requires refresh token) |
| POST /auth/logout | POST | Invalidate refresh token | Yes |

### Tenants

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| GET /tenants/me | GET | Get current tenant profile | Yes |
| PATCH /tenants/me | PATCH | Update tenant settings | Yes (Tenant Admin) |
| GET /tenants/me/members | GET | List all users in the tenant | Yes (Tenant Admin) |
| POST /tenants/me/invitations | POST | Invite a user to the tenant | Yes (Tenant Admin) |
| PATCH /tenants/me/members/:userId | PATCH | Change a members role | Yes (Tenant Admin) |
| DELETE /tenants/me/members/:userId | DELETE | Remove a member from the tenant | Yes (Tenant Admin) |
| POST /tenants/me/invitations/:token/accept | POST | Accept an invitation | No (token-based) |

### Documents

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| GET /documents | GET | List all documents for tenant | Yes |
| POST /documents | POST | Upload a new document | Yes (Tenant Admin) |
| GET /documents/:id | GET | Get document details and status | Yes |
| DELETE /documents/:id | DELETE | Delete/archived a document | Yes (Tenant Admin) |
| POST /documents/:id/reprocess | POST | Re-process a document (re-chunk, re-embed) | Yes (Tenant Admin) |

### Search (RAG)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| POST /search | POST | Submit a natural language query and get an answer | Yes |
| GET /search/history | GET | List past search queries for the tenant | Yes |

### Conversations

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| GET /conversations | GET | List conversations for the tenant | Yes |
| POST /conversations | POST | Create a new conversation | Yes |
| GET /conversations/:id | GET | Get conversation with messages | Yes |
| DELETE /conversations/:id | DELETE | Delete a conversation | Yes |

### API Keys

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| GET /api-keys | GET | List API keys for the tenant | Yes |
| POST /api-keys | POST | Create a new API key | Yes |
| DELETE /api-keys/:id | DELETE | Revoke an API key | Yes |

### Users

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| GET /users/me | GET | Get current user profile | Yes |
| PATCH /users/me | PATCH | Update profile (display name, password) | Yes |

**Why:** Each endpoint is designed around a specific user action. Tenant endpoints are scoped to /tenants/me so the tenant is derived from the authenticated user - no tenant ID in the URL reduces attack surface. The documents endpoints support the full document lifecycle including reprocessing. The search endpoint is the most critical - it is the primary RAG interaction mechanism. All search endpoints scope results to the tenants Pinecone namespace automatically.

---

## Q5: What are the request/response formats?

**Answer:**

### Success Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully."
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists."
    }
  ]
}
```

**Why:** Consistent response formats reduce client-side complexity. The data field carries the payload; the message field provides human-readable feedback; the success flag enables trivial conditional rendering in the frontend. Tenant ID is derived from the JWT, not from the request body, preventing tenant spoofing.

---

## Q6: What validation rules apply?

**Answer:**

- **Authentication:** Every endpoint except /auth/signup, /auth/login, and /auth/refresh requires a valid JWT in the Authorization header (Bearer token format).
- **Tenant scoping:** Every request that accesses tenant-specific data must include the correct tenant context derived from the JWT. The backend rejects requests where the JWT tenant_id does not match the requested resource.
- **File upload validation:** Maximum file size 50 MB. Allowed formats: PDF, DOCX, TXT. File must be a valid non-corrupt document (type verified by magic bytes, not extension).
- **Search query validation:** Query string must not be empty. Maximum length: 1000 characters. Rate limit: 30 queries per minute per user.
- **API key validation:** Key name must be unique per tenant. Maximum 10 active API keys per tenant.
- **User email validation:** Must be a valid email format. Must be unique within the tenant (not globally).
- **Password validation:** Minimum 8 characters. Must contain at least one letter and one number.
- **Pagination:** List endpoints support page and limit query parameters. Default limit: 20, maximum: 100.
- **Document status:** Only documents with status indexed are searchable. Documents with status processing or failed return helpful error messages.

**Why:** Validation rules protect the system at the API boundary - the first line of defense before data reaches the database or vector store. File size and format limits prevent abuse and protect the document processing pipeline. Query rate limiting prevents a single tenant from consuming all LLM credits. Tenant scoping via JWT is the most critical validation rule - without it, multi-tenancy isolation is broken. All validation rules are implemented using Pydantic models in FastAPI.

---

## Q7: What are the HTTP status codes?

| Status | When to Use |
|--------|-------------|
| 400 Bad Request | Invalid input data, validation errors |
| 401 Unauthorized | Missing or invalid authentication credentials |
| 403 Forbidden | Authenticated but not authorized for this action |
| 404 Not Found | Resource does not exist or user does not have access |
| 409 Conflict | Resource conflict (e.g., duplicate email, duplicate API key name) |
| 422 Unprocessable Entity | Request is well-formed but semantically invalid |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | Unexpected server error (logged server-side, not exposed to client) |

**Why:** Consistent status codes enable the frontend to handle errors predictably. Separating 400 (validation), 401 (auth), 403 (authorization), and 404 (not found) allows the frontend to take different recovery actions for each case. 409 Conflict is used for business rule violations like duplicate emails or API key names. 429 prevents runaway API usage. 500 errors are never exposed with detail to the client.

---

## Q8: What is the security approach for the API?

**Answer:**

**Authentication:**
- JWT Access Token (short-lived, 15 min) + Refresh Token (longer-lived, 7 days)
- Access token in Authorization header as Bearer token
- Refresh token as HTTP-only cookie (not localStorage)
- Tokens signed with server-side secret from environment variables
- Access token payload includes user_id and tenant_id for request scoping

**Authorization (RBAC):
- Every endpoint declares required roles: tenant_admin, end_user, platform_admin
- JWT contains the users role - backend checks before allowing access
- Tenant-scoped data access enforced at the backend level
- tenant_id extracted from JWT, used to filter all database and Pinecone queries

**Rate Limiting:**
- General API: 100 requests per minute per tenant
- Search endpoint: 30 queries per minute per user (protects LLM costs)
- Document upload: 10 uploads per hour per tenant
- Rate limit headers in responses (X-RateLimit-Limit, X-RateLimit-Remaining)
- 429 response when limit exceeded

**Why:** Security for a multi-tenant SaaS API prevents three failure categories: authentication failures (unauthorized access), authorization failures (cross-tenant data access), and input validation failures (data corruption or injection). JWT with tenant_id in the payload enforces isolation at the API level. Rate limiting protects the LLM cost model. Pydantic validation is the first defense in FastAPI.

---

## Q9: What is the external service integration approach?

**OpenAI Integration:**
- Embeddings called synchronously during document indexing
- LLM generation called synchronously during search queries with a 30-second timeout
- Same OpenAI client instance with retry logic (3 retries, exponential backoff)
- API key stored in environment variables, injected at runtime - never passed through client requests
- OpenAI requests go through the backend only - frontend never calls OpenAI directly

**Pinecone Integration:**
- Index queries include tenant namespace filter as the first parameter - non-negotiable for multi-tenancy
- Upsert operations batched (100 vectors per batch) for performance
- Connection errors trigger retry with exponential backoff
- Persistent failures mark the document as failed and queue retry

**Why:** All external service integrations follow the same pattern - the backend mediates all communication, secrets are in environment variables, and failures are handled with retry logic. The Pinecone namespace filtering pattern is the most critical integration detail - it enforces tenant isolation at the vector database level. Every Pinecone call must include the tenant namespace; if it does not, cross-tenant data leakage occurs.

---

## Q10: What are the API-level risks?

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tenant ID spoofing via manipulated token | Critical | Sign JWTs with server-side secret; never trust client-supplied tenant_id; extract tenant_id from validated JWT claims only |
| LLM API unavailability | High | Cache common queries per tenant; return stale cached answers while retrying |
| LLM cost overrun from abuse | High | Rate limit search strictly; set per-tenant monthly query budgets; monitor usage |
| OpenAI prompt injection | High | Sanitize user query before injecting into LLM prompt; prepend system instructions restricting LLM to tenant documents only |
| Large file upload causing OOM | High | Stream uploads directly to S3 via presigned URLs; reject files over 50MB before backend receives them |
| Pinecone namespace confusion | Critical | Enforce namespace = tenant_id at every Pinecone call; write integration tests verifying cross-namespace queries return nothing |
| N+1 query in document listing | Medium | Use Prisma includes for eager loading; paginate all list endpoints |
| Stale embeddings after document update | Medium | Invalidate cached search results when document is reprocessed; document stays in processing state until embeddings confirmed |

**Why:** API risks are about boundaries between the system and its users/dependencies. Tenant ID spoofing is the most dangerous - if a user can read another tenants data, the product is fundamentally broken. LLM cost overrun is a business risk that can be exploited. Prompt injection is specific to RAG systems. Each risk has a testable mitigation - not just passive monitoring but active defense.

---

## Q11: Who approves the API specification?

| Role | Name |
|------|------|
| Backend Lead | (To be assigned) |
| Frontend Lead | (To be assigned) |
| Technical Lead | (To be assigned) |
| Date | (To be set) |

**Why:** API approval ensures the frontend and backend teams have a shared contract before either writes implementation code. Without approval, teams code against mismatched assumptions - the root cause of integration delays and rework.

---

# End of Chapter 07