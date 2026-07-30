# Chapter 13 — Deployment & DevOps

---

# Objective

The purpose of Deployment and DevOps is to prepare, release, and maintain the multi-tenant RAG SaaS platform in a production environment. This phase converts the completed application into a reliable service that tenants can access and depend on. It covers infrastructure setup, containerization, CI/CD pipelines, database deployment, monitoring, logging, backups, and security hardening.

---

# Q&A

## Q1: What are the environments configured?

**Answer:**

### Development
**Purpose:** Developer machines for writing code, debugging, and local testing
**URL:** localhost (http://localhost:3000 for frontend, http://localhost:8000 for RAG microservice)
**Database:** Local PostgreSQL via Docker Compose
**RAG Microservice:** Runs locally on port 8000 via Docker Compose
**Storage:** Local filesystem (simulates S3) or Docker volume

### Staging
**Purpose:** Production-like environment for final testing, client review, and release validation
**URL:** staging.app.vendor-rag.com
**Database:** Dedicated staging PostgreSQL instance (same size as production)
**RAG Microservice:** Deployed alongside NestJS backend in staging, same container config as production
**Storage:** Separate S3 bucket for staging (isolated from production data)
**Data:** Populated with synthetic/masked tenant data, never production data

### Production
**Purpose:** Live system serving paying tenants
**URL:** app.vendor-rag.com
**Database:** Managed PostgreSQL (AWS RDS with Multi-AZ for high availability)
**RAG Microservice:** Deployed auto-scaled container in AWS ECS/Fargate
**Storage:** AWS S3 with versioning enabled and lifecycle policies
**CDN:** CloudFront for frontend static assets
**Monitoring:** Full observability stack active

**Why:** Three-tier environment separation is standard for SaaS. Development enables fast local iteration. Staging provides a release validation gate before production. Production serves real tenants and must be the most reliable and secure environment. Each environment has its own isolated data stores to prevent cross-environment data leaks or contamination.

---

## Q2: What is the infrastructure setup?

**Answer:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend Hosting | Vercel / AWS CloudFront + S3 | Serve Next.js static assets with CDN edge caching |
| NestJS Backend | AWS ECS Fargate (Docker container) | Run main API server with auto-scaling |
| RAG Microservice | AWS ECS Fargate (Docker container) | Run Python RAG processing and search service |
| Database | AWS RDS PostgreSQL (Multi-AZ) | Metadata storage with failover and automated backups |
| Vector Database | Pinecone Cloud (managed) | Tenant-scoped embedding storage and similarity search |
| File Storage | AWS S3 | Tenant-scoped document storage with versioning |
| Message Queue | AWS ElastiCache Redis (for BullMQ) | Async job queue for document processing |
| CDN | AWS CloudFront | Frontend asset delivery with edge caching |
| DNS | AWS Route53 | Domain management with health checks and failover routing |
| SSL | AWS Certificate Manager | Auto-renewing TLS certificates |
| Secrets | AWS Secrets Manager | Secure storage for database credentials, API keys, JWT secrets |
| Monitoring | CloudWatch + Sentry | Application metrics, error tracking, and alerting |
| CI/CD | GitHub Actions | Automated build, test, and deployment pipeline |

**Why:** AWS provides the full managed service stack needed for a SaaS platform without managing raw EC2 instances. Fargate eliminates container orchestration complexity (no Kubernetes management for MVP). RDS Multi-AZ provides database failover without manual intervention. Pinecone Cloud eliminates vector DB infrastructure management. CloudFront provides global CDN for fast frontend loading. Secrets Manager provides centralized, auditable secret access. Redis for BullMQ provides the message broker needed for async document processing.

---

## Q3: What is the containerization strategy?

**Answer:**

**NestJS Backend Docker Image:**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile --production=false
COPY . .
RUN pnpm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.env.example ./.env.example
EXPOSE 3000
CMD ["node", "dist/main"]
```

**Python RAG Microservice Docker Image:**
```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY app/ ./app/
COPY requirements.txt .
COPY .env.example ./.env.example
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose (Development):**
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
  backend:
    build: ./backend
    ports:
      - "3001:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rag_saaS
      - REDIS_URL=redis://redis:6379
      - RAG_SERVICE_URL=http://rag-service:8000
  rag-service:
    build: ./rag-service
    ports:
      - "8000:8000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rag_saas
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PINECONE_API_KEY=${PINECONE_API_KEY}
      - PINECONE_ENVIRONMENT=us-east1
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: rag_saas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
volumes:
  postgres_data:
```

**Why:** Multi-stage Docker builds for NestJS keep the final image small by excluding dev dependencies and source code. Separate images for NestJS and Python ensure each service runs in its optimal runtime environment. Docker Compose provides a consistent local development environment that mirrors production infrastructure. The RAG microservice communicates with the backend via the RAG_SERVICE_URL environment variable, making it easy to swap between local, staging, and production URLs.

---

## Q4: What is the CI/CD pipeline?

**Answer:**

**Repository:** GitHub
**CI Tool:** GitHub Actions
**CD Tool:** GitHub Actions + AWS deployment

**Pipeline Stages:**

1. **Code Push** -> Developer pushes to feature branch or merges PR to main
2. **Lint & Format** -> ESLint + Prettier for TypeScript, Ruff + Black for Python
3. **Type Check** -> TypeScript compilation check (`tsc --noEmit`), mypy for Python
4. **Unit Tests** -> Jest for NestJS, pytest for Python microservice
5. **Integration Tests** -> Test containers for PostgreSQL, Redis; Pinecone test namespace
6. **Build Docker Images** -> Build and tag NestJS and Python images with commit SHA
7. **Push to Registry** -> Push images to AWS ECR (Elastic Container Registry)
8. **Deploy to Staging** -> Terraform/Infrastructure as Code deploys to staging environment
9. **Smoke Tests** -> Automated health checks against staging API
10. **Deploy to Production** -> Manual approval gate in GitHub Actions, then deploy via AWS ECS task update
11. **Post-Deploy Verification** -> Automated smoke tests against production /health endpoint

**Pipeline File (`.github/workflows/deploy.yml`):**
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint NestJS
        run: npx eslint src/
      - name: Lint Python
        run: ruff check rag-service/ && black --check rag-service/
      - name: Run NestJS Tests
        run: cd backend && pnpm test
      - name: Run Python Tests
        run: cd rag-service && pytest
      - name: TypeScript Check
        run: cd backend && npx tsc --noEmit
      - name: mypy Check
        run: cd rag-service && mypy app/

  deploy:
    needs: lint-and-test
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_KEY }}
          aws-region: us-east-1
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster rag-saas --service backend --force-new-deployment
          aws ecs update-service --cluster rag-saas --service rag-service --force-new-deployment
      - name: Verify Deployment
        run: |
          curl -f https://app.vendor-rag.com/health || exit 1
```

**Why:** The CI/CD pipeline ensures code quality before deployment. Linting and type-checking catch errors at commit time. Unit and integration tests verify functionality. The manual approval gate before production deployment provides a safety pause for human review. Auto-deployment to ECS ensures consistent infrastructure provisioning. The post-deploy smoke test verifies the application is healthy immediately after deployment.

---

## Q5: What is the database deployment strategy?

**Answer:**

**Migration Strategy:**
- Prisma Migrate for PostgreSQL schema migrations (NestJS backend owns migration files)
- Migrations run automatically during the deploy step in CI/CD pipeline
- Each migration is a versioned SQL file in the `/prisma/migrations/` directory
- Migrations are tested in staging before production deployment
- No manual SQL execution in production -- all changes go through migration files

**Backup Strategy:**
- Automated daily backups of PostgreSQL via AWS RDS automated backups (7-day retention by default, configurable to 35 days)
- S3 versioning enabled for all document files (accidental deletions can be recovered)
- Encrypted backups using AWS KMS
- Backup verification test runs weekly (restore to a test environment and validate data integrity)

**Rollback Strategy:**
- Database: Prisma Migrate supports `prisma migrate revert` for the last migration -- tested in staging
- Application: ECS service deployment supports rolling back to the previous task definition instantly
- Infrastructure: Terraform state tracks infrastructure changes; `terraform apply` with previous state rolls back infrastructure
- Full rollback procedure documented and rehearsed quarterly

**Why:** Automated migrations prevent human error in schema changes. Daily backups with retention protect against data loss. The ability to revert migrations provides a safety net for bad schema changes. S3 versioning provides an additional recovery layer for document files. The rollback strategy covers all layers (database, application, infrastructure) so the team can recover quickly from any deployment issue.

---

## Q6: What environment variables are required?

**Answer:**

| Variable | Purpose | Environment |
|----------|---------|-------------|
| DATABASE_URL | PostgreSQL connection string | All environments |
| JWT_SECRET | HMAC secret for signing JWT tokens | All environments (unique per env) |
| JWT_REFRESH_SECRET | Secret for signing refresh tokens | All environments (unique per env) |
| OPENAI_API_KEY | API key for embeddings and LLM generation | All environments |
| PINECONE_API_KEY | API key for Pinecone vector DB | All environments |
| PINECONE_ENVIRONMENT | Pinecone region (e.g., us-east1) | All environments |
| S3_BUCKET_NAME | S3 bucket for document storage | All environments |
| AWS_ACCESS_KEY_ID | AWS credentials for S3 access | Staging, Production |
| AWS_SECRET_ACCESS_KEY | AWS credentials for S3 access | Staging, Production |
| REDIS_URL | Redis connection for BullMQ job queue | All environments |
| CORS_ORIGIN | Allowed frontend origin (https://app.vendor-rag.com) | Production |
| NODE_ENV | Application environment (development, staging, production) | All environments |
| LOG_LEVEL | Log verbosity (debug in dev, info/warn in production) | All environments |
| RAG_SERVICE_URL | Internal URL for Python RAG microservice | All environments |
| SMTP_HOST | Email SMTP server host | All environments |
| SMTP_PORT | Email SMTP server port | All environments |
| SMTP_USER | SMTP authentication username | All environments |
| SMTP_PASS | SMTP authentication password | All environments |
| RATE_LIMIT_MAX_PER_MINUTE | General API rate limit per tenant | All environments |
| RATE_LIMIT_SEARCH_PER_MINUTE | Search endpoint rate limit per user | All environments |
| STORAGE_MAX_FILE_SIZE_MB | Maximum file upload size (50 in production) | All environments |

**Why:** Each environment variable has a specific, documented purpose. Per-environment secrets (JWT_SECRET, DATABASE_URL) must be unique to prevent cross-environment access. The RAG_SERVICE_URL allows the NestJS backend to reach the Python microservice at different URLs per environment. Rate limiting variables allow tuning per environment (looser in development, strict in production). S3 bucket name is unique per environment to prevent staging code from writing to production storage.

---

## Q7: What does monitoring cover?

**Answer:**

**Application Monitoring (CloudWatch + Sentry):**
- API response time per endpoint and per tenant
- Error rate as percentage of total requests (target: under 1%)
- Request throughput (requests per minute)
- NestJS application health status
- Python RAG microservice health status
- Document processing queue depth (BullMQ/Redis)
- Pinecone query latency and error rate
- OpenAI API usage (token count, latency, error rate)

**Server Monitoring (CloudWatch):**
- CPU utilization for each ECS service (backend, rag-service)
- Memory utilization for each ECS service
- Disk utilization (ephemeral storage only for containers)
- Network throughput (inbound/outbound)
- Task count and scaling events

**Database Monitoring (RDS Performance Insights):**
- Database connection count
- Query execution time (slow query threshold: 1 second)
- Read/write IOPS
- CPU utilization on database instance
- Storage utilization and growth trend

**Alerting:**
- Critical alerts: Application error rate exceeds 5%, database unavailable, RAG microservice down for over 2 minutes, LLM API errors exceeding threshold
- High alerts: API response time exceeds 3 seconds p95, document processing queue depth exceeds 100 jobs, Pinecone latency exceeds 500ms
- Warning alerts: Storage usage exceeds 80% of S3 allocation, database storage approaching limit, daily LLM usage exceeds budget forecast by 20%
- Alert channels: Email for warnings, PagerDuty for critical/high alerts, Slack notifications for all alerts

**Why:** Multi-layered monitoring covers the application, server, database, and external service levels. Application monitoring catches user-facing issues. Server monitoring catches resource exhaustion. Database monitoring catches query performance degradation. Alerting with severity-based routing ensures critical issues reach the on-call engineer immediately while less urgent warnings are batched. The LLM usage alert is SaaS-specific -- it prevents cost surprises from uncontrolled query growth.

---

## Q8: What is the logging configuration?

**Answer:**

**Logging Solution:** Structured JSON logging shipped to CloudWatch Logs

**Log Levels by Environment:**
- Development: DEBUG (all internal state visible)
- Staging: INFO (normal operational messages)
- Production: WARN (suppresses informational noise, logs warnings and above)

**Log Streams Organized By:**
- NestJS backend service (all application logs)
- Python RAG microservice (processing and search logs)
- Database migration logs
- CI/CD pipeline logs

**Log Fields for Every Entry:**
- timestamp (ISO 8601)
- level (DEBUG, INFO, WARN, ERROR, CRITICAL)
- service (backend, rag-service, migrator)
- tenant_id (sanitized for PII compliance)
- request_id (correlation ID for tracing a request across services)
- message (human-readable description)
- error (stack trace, only for ERROR/CRITICAL level)

**Retention Period:**
- CloudWatch Logs: 30 days retention for application logs
- S3 for logs: 90 days with lifecycle policy (transition to cold storage, then delete)

**Error Tracking (Sentry):**
- Real-time error capture with full stack traces and context
- Grouped by error type (not by individual occurrence)
- Alert routing: Critical errors trigger PagerDuty, Errors trigger email
- Release tracking: Errors are tagged by deployment version for easier regression identification

**Why:** Structured JSON logs enable automated parsing and querying in CloudWatch and third-party tools. The request_id field enables distributed tracing across NestJS and Python microservice -- you can follow a single user search from the NestJS API through the RAG microservice to Pinecone and back. Tenant_id in logs enables per-tenant troubleshooting. The 30-day CloudWatch retention provides enough history for incident investigation while keeping storage costs reasonable. Sentry grouping prevents alert fatigue from repeated identical errors.

---

## Q9: What is the backup and recovery plan?

**Answer:**

**Backup Frequency:**
- PostgreSQL: Daily automated snapshot via AWS RDS, plus continuous WAL archiving for point-in-time recovery
- S3 Documents: Versioning enabled (every overwrite and deletion is preserved; can be restored)
- Elasticsearch/Pinecone: Rebuild by reprocessing documents from S3 source files if index is corrupted

**Storage Location:**
- PostgreSQL snapshots: AWS Backup service with cross-region replication (backed up to a secondary AWS region)
- S3 versioned files: Same S3 bucket with versioning (no separate backup needed)
- Terraform state: Stored in S3 with DynamoDB locking

**Recovery Procedure:**

**Scenario 1: Database Corruption**
1. Identify affected time range from CloudWatch Logs
2. Restore PostgreSQL RDS instance from nearest automated snapshot taken before corruption started
3. Replay WAL (Write-Ahead Log) to recover transactions up to the point of corruption
4. Verify data integrity with validation queries (count tenants, documents, users)
5. Restart NestJS and Python RAG services pointing to restored database
6. Notify affected tenants of any data loss or processing delays
7. Document root cause and preventive measures

**Scenario 2: S3 Data Loss**
1. Enable S3 versioning (should already be enabled for production -- this is a worst-case if versioning was misconfigured)
2. Restore affected objects from version history
3. If versioning was not enabled, request AWS support for S3 restoration from their backup (limited to 30 days)
4. Update document status to "failed" for any documents whose chunks were lost and reprocess from restored source files

**Scenario 3: Full Application Failure**
1. Deploy NestJS and Python RAG services from previous known-good Docker image
2. Point services to existing (healthy) databases
3. Run smoke tests to verify functionality
4. Switch DNS (Route53) to the new deployment if needed
5. Monitor error rates and response times post-recovery

**Recovery Testing:**
- Snapshot restoration tested quarterly in staging environment
- RAG index rebuild from S3 source files tested quarterly
- Full application rollback procedure rehearsed quarterly with tabletop exercise
- Recovery Time Objective (RTO): Under 1 hour for database restoration
- Recovery Point Objective (RPO): Under 1 hour of data loss (daily backups + WAL archiving)

**Why:** Backup and recovery is essential for a SaaS platform handling tenant documents. The cross-region snapshot replication protects against regional AWS outages. S3 versioning provides an automatic safety net for document files. Documented recovery procedures with tested RTO/RPO targets ensure the team can respond quickly and predictably when incidents occur. Quarterly testing ensures the procedures are still valid and team members remember them under pressure.

---

## Q10: What is the security checklist for production?

**Answer:**

- HTTPS enabled on all endpoints (TLS 1.2+ via CloudFront/ACM)
- HTTP redirect enforced (all HTTP requests redirected to HTTPS)
- Secrets stored in AWS Secrets Manager or environment variables (never in code, never in git)
- .gitignore excludes .env files, Docker secrets, and all configuration with sensitive values
- Database access restricted to ECS task role only (no public internet access to PostgreSQL)
- S3 bucket policy blocks public access and requires authentication via IAM role
- Pinecone API key has index-level permissions scoped to the specific index
- Rate limiting active on all API endpoints to prevent abuse
- CORS configured to allow only the production frontend origin
- Security headers active (HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- HTTP-only cookies for JWT refresh tokens (prevents XSS token theft)
- Regular dependency scanning (npm audit, pip-audit, GitHub Dependabot)
- AWS security groups configured to allow only required ports (443 for HTTPS, no SSH on production)
- IAM roles follow least-privilege principle (ECS tasks only have permissions they need)
- OpenAI API key has usage limits and monitoring alerts set on dashboard
- All Pii in logs sanitized (tenant_id is a UUID, not PII; no user emails or document content in logs)
- Penetration testing of the production application planned before launch

**Why:** The security checklist covers the OWASP Top 10 for SaaS applications plus multi-tenancy-specific concerns. HTTPS is the foundation of all web security. Secret management prevents credential leaks. Database and S3 access restrictions ensure that compromised application code cannot directly access resources. Rate limiting protects the LLM cost model. Dependency scanning catches known vulnerabilities early. Penetration testing provides a professional security assessment before the platform goes live with real tenant data.

---

## Q11: What is the production release checklist?

**Answer:**

- Backend Docker images built and pushed to ECR with version tag matching release tag
- RAG microservice Docker images built and pushed to ECR with same version tag
- Terraform plan reviewed and approved for infrastructure changes
- Database migrations tested in staging environment
- Database migration script reviewed by two developers before execution
- Smoke tests pass against staging environment (all 18 test cases from Chapter 12)
- Terraform apply executed for production infrastructure
- ECS services updated with new task definitions (rolling deployment with health checks)
- /health endpoint returns 200 from production URL (https://app.vendor-rag.com/health)
- CloudWatch alarms verified as active in production (critical and high alerts)
- Sentry error tracking confirmed working (deliberately triggered test error captured)
- Database backup verified (latest snapshot exists and is not corrupt)
- S3 versioning confirmed active on production bucket
- DNS (Route53) CNAME pointing to CloudFront distribution confirmed
- SSL certificate (ACM) confirmed valid and auto-renewal configured
- Client notified of production deployment schedule and expected downtime (zero-downtime deployment)
- On-call engineer on rotation for 24 hours post-deployment
- Incident response runbook accessible to on-call engineer
- All pipeline stages passing in GitHub Actions for the release commit

**Why:** The release checklist ensures every production deployment follows the same rigorous process. Docker image versioning matches the release tag for easy rollback. Terraform plan review catches infrastructure errors before they execute in production. Database migration testing in staging prevents schema failures in production. Smoke tests verify the deployed application works before directing tenant traffic to it. The on-call rotation ensures someone can respond immediately if issues arise post-deployment. The zero-downtime goal keeps the platform available during deployments.

---

## Q12: Who approves the production deployment?

| Role | Name |
|------|------|
| DevOps Engineer | (To be assigned) |
| Backend Lead | (To be assigned) |
| Technical Lead | (To be assigned) |
| Product Owner | (To be assigned) |
| Client (Beta) | (To be assigned) |
| Date | (To be set) |

**Why:** Production deployment approval ensures all stakeholders confirm readiness. The DevOps engineer confirms infrastructure and pipeline. The backend lead confirms code quality and test results. The technical lead confirms architecture and security. The product owner confirms all MVP features are working. The client beta tester confirms the actual user experience works. This multi-stakeholder approval is the final gate before real tenant data is exposed to the platform.

---

# End of Chapter 13
