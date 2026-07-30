# Chapter 09 — Backend Foundation

---

# Objective

The purpose of the Backend Foundation phase is to establish the project's technical infrastructure before implementing business features. The project uses a dual-backend architecture: NestJS as the primary application server handling auth, tenant management, and document operations, and a separate Python microservice for the RAG pipeline (document parsing, chunking, embedding generation, and vector search). This separation ensures that AI/ML workloads scale independently from the main API and that each service is written in the right language for its responsibility.

---

# Q&A

## Q1: How is the project initialized?

**Answer:**

**Main Backend (NestJS): TypeScript + Node.js
**RAG Microservice (Python): FastAPI + Python 3.11+
**Monorepo Manager:**pnpm workspaces for NestJS, pip + poetry for the Python microservice
**Repository:** Git repository on GitHub with two top-level packages: `backend/` (NestJS) and `rag-service/` (Python)

**Project structure:**

```
multi-tenant-rag-app/
  backend/                    <-- NestJS (main API)
    src/
      app.module.ts
      main.ts
      config/
      modules/
        auth/
        tenants/
        documents/
        conversations/
        api-keys/
        users/
      common/
        middleware/
        filters/
        guards/
        interceptors/
      database/
      health/
    test/
    package.json
    tsconfig.json
    Dockerfile
    .env.example
  rag-service/                <-- Python RAG Microservice
    app/
      __init__.py
      main.py
      config/
      parsers/
        pdf_parser.py
        docx_parser.py
        txt_parser.py
      chunking/
        text_splitter.py
      embedding/
        openai_client.py
        vector_store.py
      models/
      schemas/
      services/
        document_processing.py
        search_service.py
      database/
      tests/
    requirements.txt
    Dockerfile
    .env.example
  docker-compose.yml
  README.md
  pnpm-workspace.yaml
```

**Why:** NestJS provides a structured, enterprise-grade Node.js framework with dependency injection, decorators, and TypeScript end-to-end. FastAPI is the best Python framework for building APIs quickly with async support and automatic validation. Separating the RAG pipeline into its own microservice means the CPU-intensive ML workloads (embedding generation, vector indexing) can scale independently from the main API. The monorepo structure keeps both services in version sync and simplifies CI/CD pipeline management. The separation also means each team member can work in their preferred language stack without conflicts.

---

## Q2: How is configuration managed?

**Answer:**

**Environment Variables:** Both NestJS and the Python microservice use environment variables loaded from `.env` files for local development and injected via the deployment environment for production.

**NestJS Configuration (`config/` module):**
- `ConfigService` — centralized service that reads and validates all env vars at startup
- Uses `@nestjs/config` package with a validation schema (Joi)
- If any required variable is missing or invalid, the application fails fast with a clear error message

**Python Microservice Configuration:**
- Pydantic `BaseSettings` (from pydantic-settings) validates all configuration
- Same env var names as NestJS where values are shared (DATABASE_URL, REDIS_URL, JWT_SECRET)
- Service-specific vars prefixed with `RAG_` (RAG_OPENAI_API_KEY, RAG_PINECONE_API_KEY)

**Secrets Management:**
- Secrets (JWT secret, database passwords, API keys) stored in environment variables only
- `.env` files excluded from git via `.gitignore`
- In production, secrets injected via deployment platform (GitHub Actions secrets, AWS Secrets Manager)

**Why:** Consistent configuration management across both services prevents configuration drift. Validating at startup catches misconfiguration early -- before the application serves traffic or processes documents. Separating shared and service-specific config variables makes it clear which secrets go where and reduces the blast radius of a secret leak.

---

## Q3: How are the databases connected?

**Answer:**

**NestJS (Main Backend) Database:**
- **Database:** PostgreSQL
- **ORM:** Prisma (managed via the NestJS backend
- **Connection:** Async connection pool with min 5 and max 10 connections
- **Health Check:** Prisma `$connect` verified on application startup
- **Migration Tool:** Prisma Migrate for schema migrations and version tracking

**Python Microservice Database Access:**
- **Primary:** PostgreSQL (via Prisma Client or direct asyncpg connection for read-heavy operations)
- **Vector Database:** Pinecone Cloud
- **Object Storage:** AWS S3 (for raw document files)
- **ORM:** SQLAlchemy 2.0 with async support for relational queries
- **Pinecone Client:** Official Pinecone Python SDK

**Connection Architecture:**
- Both services connect to the same PostgreSQL instance but use different connection pools
- The NestJS backend manages the application metadata tables: tenants, users, documents, conversations, api_keys, invitations
- The Python microservice manages or references the same tables for operations that span both systems (e.g., marking a document as indexed)
- Pinecone is only accessed by the Python microservice -- it is never exposed through the NestJS API directly

**Why:** Both services need access to PostgreSQL metadata, but for different purposes. NestJS owns the application data model and business logic. The Python microservice needs to read/write document status and trigger processing. Separating the vector DB access to the microservice enforces the architectural boundary -- only the RAG pipeline talks to Pinecone, reducing the attack surface and preventing accidental Pinecone queries from the main API.

---

## Q4: How is logging configured?

**Answer:**

**NestJS Logging:**
- Built-in NestJS logger for application-level logging
- Structured JSON logging using `nest-winston` or `pino` package
- Log levels: DEBUG (development), INFO (production), WARN, ERROR, CRITICAL
- Request logging interceptor logs method, path, status code, response time, and tenant_id for every incoming request

**Python Microservice Logging:**
- Python standard library `logging` module with JSON formatter
- Same log level hierarchy as NestJS for consistency
- RAG-specific logging: document processing progress, embedding generation, Pinecone operations

**Audit Logging:**
- Administrative actions (user created, document deleted, tenant settings changed) recorded in a dedicated `audit_logs` table in PostgreSQL
- Fields: timestamp, actor_user_id, actor_tenant_id, action, target_entity, target_entity_id, metadata (JSONB)

**Why:** Consistent structured JSON logging across both services enables unified log aggregation in a single observability platform (Sentry, Datadog, CloudWatch). Audit logging provides an immutable record of who changed what and when -- essential for a multi-tenant SaaS where tenant admins must be able to trust the platform and investigate any suspicious activity.

---

## Q5: How is global middleware and guards configured in NestJS?

**Answer:**

**NestJS Middleware Stack:**
- **CORS:** Configured to allow the Next.js frontend origin only. Credentials enabled for cookie-based auth.
- **Security Headers:** Helmet middleware -- X-Content-Type-Options, X-Frame-Options, HSTS, XSS protection.
- **Compression:** gzip and Brotli compression on all responses.
- **Rate Limiting:** `@nestjs/throttler` for per-tenant rate limiting using a sliding window.
- **Request Logging:** Custom middleware that logs method, path, status, duration, and tenant_id.
- **Tenant Extraction:** Global guard that extracts tenant_id from the JWT token and attaches it to the request object for downstream handlers.
- **Query Serialization:** Custom interceptor that serializes Prisma query results to remove null/undefined fields and ensure consistent response format.

**NestJS Guards:**
- **AuthGuard (JWT):** Validates the Bearer token on protected routes. Extracts user_id and tenant_id from the token payload.
- **TenantGuard:** Ensures the authenticated user has access to the requested tenant resource.
- **RoleGuard:** Checks the user's role (tenant_admin, end_user, platform_admin) against the endpoint's required role decorator.
- **TenantScopingGuard:** Filters all database queries in the request context to the correct tenant_id automatically.

**NestJS Interceptors:**
- **ResponseInterceptor:** Wraps all successful responses in the standard JSON format `{ success: true, data: {}, message:  }`.
- **ErrorInterceptor:** Catches all exceptions and transforms them into the standard error JSON format `{ success: false, message: , errors: [] }`.
- **LoggingInterceptor:** Logs request duration and tenant context for performance monitoring.

**Why:** NestJS provides built-in support for middleware, guards, and interceptors that cleanly separate cross-cutting concerns. The guard chain (Auth -> Tenant -> Role -> TenantScoping) ensures that every request is authenticated, scoped to the correct tenant, and authorized before reaching any business logic. Interceptors standardize all responses -- no controller ever returns a raw object -- ensuring consistency across the entire API surface.

---

## Q6: How is error handling implemented in NestJS?

**Answer:**

**Global Exception Filter:** A custom ` AllExceptionsFilter` registered at the application level catches all unhandled exceptions (including those from guards, interceptors, and filters) and returns a standardized error response without exposing internal stack traces to the client.

**Response Format for Errors:**
```json
{
  "success": false,
  "message": "An unexpected error occurred.",
  "errors": []
}
```

**Custom Exceptions (NestJS Exception Classes):**
- `TenantNotFoundException extends HttpException` (404)
- `DocumentNotAccessibleException extends HttpException` (403)
- `DocumentProcessingException extends HttpException` (500)
- `VectorDBException extends HttpException` (503)
- `LLMIntegrationException extends HttpException` (503)
- `BusinessValidationException extends HttpException` (422)
- `RateLimitExceededException extends HttpException` (429)
- `CrossTenantAccessException extends HttpException` (403)

**Why:** Centralized error handling via NestJS filters ensures the frontend always receives a consistent, parseable error response. Custom exception classes carry HTTP status codes and business-meaningful error codes that the frontend can use for specific recovery actions. The global filter prevents stack traces from leaking to clients -- stack traces expose internal architecture and create security risks in a multi-tenant SaaS.

---

## Q7: How is the NestJS authentication and authorization infrastructure prepared?

**Answer:**

**JWT Setup (NestJS Auth Module):**
- Access Token: JWT signed with HS256, expires in 15 minutes, payload includes `{ userId, tenantId, role }`
- Refresh Token: JWT signed with HS256, expires in 7 days, payload includes `{ userId, tenantId }`
- Access token passed in Authorization header as `Bearer <token>`
- Refresh token sent as HTTP-only, Secure, SameSite=Strict cookie via NestJS response
- Token secret stored in `JWT_SECRET` environment variable
- Refresh token rotation: issuing a new refresh token on each refresh request invalidates the old one

**Password Hashing:** bcrypt with 12 rounds via the `@nestjs/passport` + `passport-local` strategy using bcryptjs

**NestJS Guards:**
- `JwtAuthGuard` extends `AuthGuard('jwt')` -- validates JWT from Authorization header via Passport strategy
- `TenantGuard` -- resolves the tenant from the validated JWT payload and attaches it to the request
- `RoleGuard` with `@Roles('tenant_admin', 'end_user')` decorator -- enforces RBAC per endpoint
- `TenantScopingGuard` -- ensures the authenticated user belongs to the requested tenant resource

**RBAC Roles:**
- `tenant_admin`: full control over their tenant (upload documents, manage team, configure settings)
- `end_user`: can search documents and retrieve answers via RAG pipeline
- `platform_admin`: can manage all tenants, view system health, handle escalations

**Strategy Pattern (NestJS):** Passport strategies define how authentication works. The local strategy validates email+password against the database. The JWT strategy validates the access token on subsequent requests. NestJS Passport integration means adding new auth methods (OAuth, API key) requires only a new strategy class.

**Why:** NestJS Passport integration is the standard approach for authentication in NestJS applications. JWT with short access and long refresh tokens balances security with user experience. HTTP-only cookies for refresh prevent XSS token theft. bcrypt with 12 rounds provides strong password protection. The strategy pattern enables clean extensibility -- adding OAuth or API key auth does not modify existing auth code.

---

## Q8: How do NestJS and the Python RAG microservice communicate?

**Answer:**

**Communication Pattern:** HTTP/REST for synchronous calls; message queue (Redis or RabbitMQ) for asynchronous tasks

**Synchronous Communication (HTTP):**
- NestJS backend makes HTTP calls to the Python microservice for operations that need an immediate response
- Endpoints on the Python microservice:
  - `POST /rag/process-document` -- triggers document parsing, chunking, and embedding (async, returns job ID immediately)
  - `POST /rag/search` -- receives a query, returns embedded search results with source chunks
  - `GET /rag/health` -- health check for the RAG microservice
  - `POST /rag/reprocess-document` -- re-processes an existing document (async)

**Asynchronous Communication (Redis Pub/Sub or Message Queue):**
- Long-running tasks (document processing, embedding generation for large documents) are queued
- NestJS pushes a job to a Redis queue (BullMQ) or publishes an event to a Redis channel
- The Python microservice consumes the queue, processes the document, updates PostgreSQL status, and publishes completion
- NestJS listens for completion events or the Frontend polls for status

**Service Discovery:**
- In development: `rag-service:8001` (Docker Compose service name)
- In production: service name via environment variable (e.g., `RAG_SERVICE_URL`)
- Circuit breaker pattern implemented in NestJS (`@nestjs/plugins` or custom interceptor) to handle RAG microservice downtime gracefully

**Why:** Separating the RAG pipeline into a dedicated microservice provides clear architectural boundaries and independent scalability. The Python microservice can be scaled up independently when many documents need processing. NestJS handles user-facing API requests with low latency, while the Python service handles CPU-bound ML operations. HTTP for sync calls keeps things simple for MVP, and Redis/BullMQ for async ensures long-running document processing does not block API responses.

---

## Q9: How is API documentation configured in NestJS?

**Answer:**

**OpenAPI/Swagger:** NestJS auto-generates OpenAPI documentation using the `@nestjs/swagger` package. The Swagger UI is available at `/api/docs`.

**Health Check Endpoint:** GET `/health` returns 200 OK with JSON confirming the application is running and connected to PostgreSQL. The endpoint also checks connectivity to the RAG microservice and reports its status.

**API Versioning:** NestJS built-in versioning with URI prefix -- all endpoints under `/api/v1/`.

**Why:** NestJS's swagger integration keeps documentation in sync with code via decorators on controllers and DTOs. The health endpoint is essential for deployment health checks, container orchestration readiness probes, and load balancer configuration. Built-in versioning keeps API evolution organized as the product grows.

---

## Q10: How is code quality managed across both services?

**Answer:**

**NestJS (TypeScript):**
- **Linting:** ESLint with `@typescript-eslint` rules
- **Formatting:** Prettier
- **Type Checking:** TypeScript strict mode (`tsconfig.json` with `strict: true`)
- **Testing Framework:** Jest with `@nestjs/testing` for integration tests
- **Git Hooks:** pre-commit with husky + lint-staged (run ESLint, Prettier, and nest-cli lint)

**Python Microservice:**
- **Linting:** Ruff (fast Python linter)
- **Formatting:** Black (opinionated formatter)
- **Type Checking:** mypy (static type checking)
- **Testing Framework:** pytest with pytest-asyncio
- **Git Hooks:** pre-commit (run ruff, black, mypy, pytest)

**Code Quality Standards (both services):**
- All endpoints have type-annotated Pydantic (Python) or DTO (NestJS) schemas for requests and responses
- All database queries use async/await with proper connection management
- No `any` types in TypeScript; no untyped parameters in Python
- Docstrings follow Google style; JSDoc decorates all public methods in NestJS
- Test files co-located with implementation files
- 100% branch coverage required for business logic modules in both services

**CI/CD Pipeline (GitHub Actions):**
- Lint TypeScript (ESLint + Prettier) on backend/ changes
- Type-check TypeScript (tsc --noEmit) on backend/ changes
- Lint Python (Ruff + Black) on rag-service/ changes
- Type-check Python (mypy) on rag-service/ changes
- Run unit tests for both services independently
- Build Docker images for both services
- Push to AWS ECR or Docker registry

**Why:** Consistent code quality practices across both services prevent the polyglot nature from creating code quality gaps. ESLint and Pydantic/TypeScript catch bugs at development time. jest and pytest ensure reliability. Pre-commit hooks prevent poorly formatted or untested code from entering the repository. The CI/CD pipeline runs checks independently per service -- a TypeScript lint error does not block Python service deployment and vice versa.

---

## Q11: What are the backend foundation risks?

**Answer:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-service communication failure | High | Implement circuit breaker pattern in NestJS; cache last-known RAG service status; queue requests during downtime |
| Environment misconfiguration | High | Validate all settings on startup in both services; fail fast with clear error messages |
| JWT secret exposure | Critical | Never log tokens or secrets; use env vars only; scan git history for secret leaks via GitHub secret scanning |
| Prisma schema drift between services | Medium | Share Prisma schema for PostgreSQL tables; Python microservice uses separate models for shared tables |
| NestJS and Python microservice version drift | Medium | Both services deployed together via same CI/CD pipeline; shared version tag in docker-compose
| Dependency vulnerabilities | High | Regular `npm audit` and `pip-audit` checks; pin all dependency versions; automated Dependabot PRs for both package managers |
| RAG microservice scaling bottleneck | Medium | Container-based auto-scaling for the Python service; Redis queue for job buffering; monitor queue depth via CloudWatch |
| Configuration drift between dev/staging/prod | Medium | Single `` `.env.example` file for each service, checked into git; CI validates all required variables exist in each environment |

**Why:** Cross-service communication is the #1 new risk introduced by the microservice architecture. If the Python RAG service goes down, document processing and search fail entirely -- the circuit breaker pattern and queuing prevent cascading failures. Prisma schema drift and version drift between the two codebases could cause subtle bugs where one service expects a schema the other does not support. JWT secret exposure and dependency vulnerabilities are the same risks as any SaaS platform. Each risk has a specific, actionable mitigation rather than vague monitoring advice.

---

## Q12: Who approves the backend foundation setup?

| Role | Name |
|------|------|
| Backend Lead | (To be assigned) |
| Technical Lead | (To be assigned) |
| Date | (To be set) |

---

# End of Chapter 09