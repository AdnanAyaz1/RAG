# Chapter 02 — Requirements Engineering

---

# Objective

Requirements Engineering transforms our product idea into clear, complete, and actionable specifications. The goal is to ensure everyone on the team has a shared understanding of what the RAG SaaS platform must do before any design or implementation begins.

A well-written requirements document reduces misunderstandings, prevents rework, and serves as the foundation for design, implementation, testing, and client acceptance.

---

# Q&A

## Q1: What are the functional requirements? (What the system must do)

**Answer:**

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-001 | Tenant admin can register an account | High | Self-service signup |
| FR-002 | End users can log in securely | High | JWT-based auth |
| FR-003 | Tenant admin can upload documents (PDF, DOCX, TXT) | High | File validation and size limit |
| FR-004 | Platform parses uploaded documents and chunks them | High | Background job processing |
| FR-005 | Chunks are converted to embeddings and stored | High | Vector DB storage per tenant |
| FR-006 | End users can ask natural language questions | High | RAG pipeline retrieves + generates |
| FR-007 | Answers are grounded in uploaded documents | High | Source citation included |
| FR-008 | Tenant admin can view/manage uploaded documents | High | List, delete, re-process |
| FR-009 | Tenants are fully isolated from each other | Critical | No cross-tenant data access |
| FR-010 | Each tenant has a configurable settings page | Medium | Embedding model, chunk size |
| FR-011 | Search results show source documents | Medium | Grounding evidence |
| FR-012 | System sends email on invite/account changes | Medium | SMTP integration |
| FR-013 | Platform admin can view all tenants | Low | Dashboard |
| FR-014 | API keys per tenant for programmatic access | Medium | Rate-limited |

**Why:** Functional requirements define every feature the system must deliver. FR-001 through FR-009 are the core MVP requirements — without them, the product does not work. FR-010 through FR-014 are important but can be deferred if time is constrained. Tenant isolation (FR-009) is critical because it is the foundation of the SaaS model and a security requirement.

---

## Q2: What are the non-functional requirements? (Quality attributes)

**Answer:**

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | API response time for retrieval | Under 2 seconds for normal queries |
| NFR-002 | Document indexing latency | Under 30 seconds per document after upload |
| NFR-003 | System availability | 99.5% uptime |
| NFR-004 | Authentication security | JWT with access + refresh tokens; bcrypt hashed passwords |
| NFR-005 | Tenant data isolation | Zero cross-tenant data leakage (verified by tests) |
| NFR-006 | Concurrent tenant capacity | At least 100 tenants on a single deployment |
| NFR-007 | File upload size limit | 50 MB per file |
| NFR-008 | Browser support | Latest Chrome, Firefox, Edge |
| NFR-009 | Error rate | Under 1% of requests result in server errors |
| NFR-010 | Scalability | System supports horizontal scaling of backend workers |

**Why:** Non-functional requirements define how well the system performs, not just what it does. Response time (NFR-001) and indexing latency (NFR-002) directly affect user experience. Tenant isolation (NFR-005) is a hard requirement — if it fails, the product is unusable for a SaaS model. Capacity (NFR-006) proves the multi-tenant architecture holds. These are measured, not subjective.

---

## Q3: What are the business rules?

**Answer:**

| ID | Rule |
|----|------|
| BR-001 | Each document belongs to exactly one tenant |
| BR-002 | A tenant cannot access or search another tenant's documents |
| BR-003 | Documents must be parsed and indexed before they are searchable |
| BR-004 | End users can only search documents within their own tenant |
| BR-005 | Tenant admin is the owner of their tenant's data |
| BR-006 | Archived documents are excluded from search results |
| BR-007 | A tenant must have at least one active admin |
| BR-008 | API keys are scoped to the tenant that created them |
| BR-009 | Embeddings are regenerated when a document is re-processed |
| BR-010 | Platform admins cannot view tenant document content |

**Why:** Business rules encode the operational policies of the SaaS platform. Tenant isolation rules (BR-001, BR-002, BR-004) are security-critical — they enforce the multi-tenancy contract. Document lifecycle rules (BR-003, BR-006, BR-009) ensure the RAG pipeline works correctly. The admin rules (BR-005, BR-010) define the trust boundary between the platform and its tenants.

---

## Q4: What constraints shape the implementation?

**Answer:**

Budget: Lean startup — prioritize open-source tools and cloud free tiers. No paid licenses in MVP.

Timeline: 4 weeks to MVP delivery.

Technology Stack: Next.js (frontend), Python/FastAPI (backend), PostgreSQL (metadata), Pinecone (vector DB), OpenAI API (embeddings + LLM), Docker (containerization), GitHub Actions (CI/CD).

Compliance: GDPR-compliant data handling. No personal data in LLM prompts beyond what is necessary. Data residency — tenant data stored in single region.

Third-Party Integrations: OpenAI API for embeddings, Pinecone Cloud for vector storage, SMTP service for emails.

Existing Systems: None — greenfield project.

Other Constraints: Shared infrastructure (multi-tenant), single codebase for all tenants, document size limit 50MB, English language only for MVP.

**Why:** Constraints are non-negotiable boundaries. The tech stack is chosen for speed-to-market and cost efficiency. OpenAI and Pinecone are market leaders with good developer experience. GDPR compliance is a legal requirement for EU tenants. The 4-week timeline forces priority decisions — everything not in the MVP scope is deferred.

---

## Q5: What assumptions are we making?

**Answer:**

- Every tenant has at least one admin user.
- All end users have a valid email address for account creation.
- Documents are primarily in English for MVP.
- Internet connectivity is available for all users (cloud-only SaaS).
- Tenants accept that their document content may be processed by OpenAI API for embeddings.
- Vector database (Pinecone) is available and reliable for MVP scale.
- PDFs and DOCX files are well-formed and parseable.
- Each tenant will not exceed 1000 documents in MVP.
- The platform will run on a single cloud region initially.
- Tenant isolation is enforced at the application and database level (not just UI-level).

**Why:** Assumptions are accepted as true until validated. Document parseability is a key risk — malformed PDFs will break the pipeline. The 1000-document assumption defines the vector DB indexing strategy. Tenant acceptance of OpenAI API processing is a data privacy consideration that must be disclosed in the privacy policy. Single-region assumption affects compliance for tenants with data residency requirements.

---

## Q6: What are the project dependencies?

**Answer:**

- OpenAI API — embeddings generation and LLM answers
- Pinecone Cloud — vector storage and similarity search
- PostgreSQL — metadata storage (users, tenants, documents, chunks)
- SMTP/Email service — tenant invites and notifications
- Next.js frontend framework
- FastAPI backend framework
- Docker — containerization and deployment consistency
- GitHub — source control and CI/CD
- Cloud storage (AWS S3 or equivalent) — file storage for uploaded documents
- Prisma ORM — database access and migrations

**Why:** Dependencies define what must be in place before development can proceed. OpenAI and Pinecone are core to the RAG pipeline — without them, the product cannot function. PostgreSQL and Prisma form the data layer. The email service and S3 are supporting infrastructure. Each dependency needs to be provisioned and configured before the backend can be built.

---

## Q7: What is out of scope for this project?

**Answer:**

- Billing and subscription management (Stripe integration deferred to Phase 2)
- Mobile application (web-only for MVP)
- Multi-language document processing (English only)
- On-premise/self-hosted deployment (cloud-only SaaS)
- Fine-tuning of LLM models (use off-the-shelf models only)
- Audit logging (basic logging only, full audit trail in future)
- Document versioning and history tracking
- White-labeling or custom branding per tenant
- API rate limiting by subscription tier (basic rate limiting only)
- Offline mode or local storage

**Why:** Scope creep is the enemy of a tight MVP timeline. Billing, mobile, and multi-language are natural Phase 2 features. On-premise deployment contradicts the SaaS model. Fine-tuning and audit logging are compliance/advanced features that require more time and legal review. Each exclusion is justified by the 4-week constraint and the need to deliver a focused, working product.

---

## Q8: What are the acceptance criteria for the MVP?

**Answer:**

The MVP is accepted when:

- Tenant admin can sign up and create a tenant workspace.
- Tenant admin can upload PDF, DOCX, and TXT documents.
- Uploaded documents are parsed, chunked, embedded, and stored.
- End users can log in with tenant credentials.
- End users can ask natural language questions about their tenant's documents.
- Answers are returned within 2 seconds and are grounded in the uploaded documents.
- Source documents are cited in responses.
- Tenant A cannot access Tenant B's documents or search results under any circumstance.
- Platform admin can view all registered tenants from the admin panel.
- All high-priority functional requirements pass.
- Critical and high-severity bugs are resolved.
- The system handles at least 10 concurrent users per tenant without errors.

**Why:** Acceptance criteria are the gates between "development is done" and "the client accepts the product." Each criterion maps to a functional or non-functional requirement. Tenant isolation is tested explicitly because a data leak would be a showstopper. The 2-second response time ensures the RAG experience feels responsive. The concurrent user threshold validates basic multi-tenancy performance.

---

## Q9: What are the key risks?

**Answer:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API rate limits or downtime | High | Implement caching of embeddings; add retry logic with exponential backoff |
| Cross-tenant data leakage | Critical | Write integration tests for tenant isolation; enforce tenant_id in every query |
| Document parsing failures | High | Support multiple formats; validate file integrity before processing; provide clear error messages |
| Vector DB cost overruns at scale | Medium | Use namespace per tenant in Pinecone; monitor usage; set per-tenant chunk limits |
| LLM-generated hallucinations | High | Require source citation in every answer; implement confidence threshold |
| Scope creep from feature requests | High | Freeze MVP scope; maintain a backlog for Phase 2 |
| GDPR non-compliance | Critical | Implement data deletion endpoint per tenant; no personal data sent to LLM; privacy policy in place |
| Performance degradation with large documents | Medium | Enforce 50MB file limit; implement async processing with progress indicators |

**Why:** Risks must be identified and mitigated proactively. OpenAI API reliability is a business risk — if the API is down, the product is unusable. Cross-tenant leakage is a trust and legal risk. Hallucinations undermine the core value proposition of the RAG system. GDPR compliance is a legal risk with significant penalties. Each mitigation maps directly to the risk and is actionable during development.

---

## Q10: Who approves these requirements?

| Role | Name |
|------|------|
| Product Owner | (To be assigned) |
| Business Analyst | (To be assigned) |
| Technical Lead | (To be assigned) |
| Tenant Rep (Beta) | (To be assigned) |
| Date | (To be set) |

**Why:** Stakeholder approval validates that the requirements accurately reflect business needs and are feasible to implement. The tenant rep provides a reality check from the customer perspective. Without approval, the team risks building the wrong product or building it in a way that cannot be delivered within constraints.