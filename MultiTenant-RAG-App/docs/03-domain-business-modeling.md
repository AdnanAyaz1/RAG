# Chapter 04 — Domain & Business Modeling

---

# Objective

Domain & Business Modeling transforms our requirements into a clear understanding of how the business operates — specifically, how organizations interact with multi-tenant document storage, AI-powered search, and retrieval.

The goal is to identify the business entities, actors, workflows, relationships, and rules that define the RAG SaaS domain. A correct domain model ensures the software reflects the business — not the other way around.

---

# Q&A

## Q1: Who interacts with the system? (Actors)

**Answer:**

| Actor | Description | Responsibilities |
|-------|-------------|------------------|
| Tenant Admin | Organization owner / team lead | Signs up tenant, uploads documents, manages team members, configures settings |
| End User | Employee of a tenant organization | Logs in, searches documents, asks questions, views results |
| Platform Admin | SaaS platform operator | Manages all tenants, monitors system health, handles escalations |
| Background Worker | Automated system process | Parses uploaded documents, chunks text, generates embeddings, indexes in vector DB |
| OpenAI Service | External AI provider | Generates embeddings from text chunks, generates answers from retrieved context |
| Pinecone Service | External vector database | Stores and queries vector embeddings per tenant namespace |
| SMTP/Email Service | External email provider | Sends tenant invites, notifications, and security alerts |

**Why:** Identifying actors is the foundation of the domain model. Tenant Admin and End User are the primary actors — everything in the system exists to serve them. Platform Admin is secondary but essential for multi-tenancy operations. Background Workers are unique to the RAG pipeline — they transform uploaded documents into searchable knowledge. External services (OpenAI, Pinecone, SMTP) are actors because they have well-defined interfaces and failure modes that the domain must account for.

---

## Q2: What business entities exist in our system? (Business Entities)

**Answer:**

| Entity | Description |
|--------|-------------|
| Tenant | An organization using the SaaS platform — has its own isolated data space |
| User | A person with an account — belongs to exactly one tenant |
| Document | An uploaded file (PDF, DOCX, TXT) provided by a tenant for RAG processing |
| Chunk | A subdivided piece of a document — the unit that is embedded and searched |
| Embedding | A vector representation of a chunk — used for similarity search |
| Search Query | A natural language question submitted by an end user |
| Search Result | Retrieved chunks ranked by relevance to the query |
| RAG Response | The AI-generated answer grounded in retrieved search results |
| Conversation | A session of questions and answers tied to a tenant's documents |
| API Key | A tenant-scoped key for programmatic access to the RAG API |
| Invitation | A token sent to a new user to join a tenant |

**Why:** Each entity represents a real concept in the business domain. Tenant is the top-level entity — it defines the boundary of multi-tenancy isolation. Document and Chunk represent the RAG pipeline's transformation of raw files into searchable units. Embedding is the bridge between text and vector search. Conversation represents the interactive experience end users have. API Key and Invitation are operational entities for tenant management and onboarding.

Note: We deliberately separate Chunk from Document and Embedding from Chunk. The RAG pipeline transforms Document → Chunks → Embeddings, and each stage is a distinct entity. This mirrors the actual engineering architecture and makes the data model accurate.

---

## Q3: How do the business entities relate to each other? (Relationships)

**Answer:**

| Entity A | Relationship | Entity B |
|----------|-------------|----------|
| Tenant | Owns many | Tenants → Users |
| Tenant | Owns many | Tenants → Documents |
| Tenant | Owns many | Tenants → API Keys |
| Tenant | Owns many | Tenants → Conversations |
| User | Belongs to one | User → Tenant |
| User | Participates in many | User → Conversations |
| User | Can have many | User → Invitations (sent by) |
| Document | Belongs to one | Document → Tenant |
| Document | Contains many | Document → Chunks |
| Chunk | Belongs to one | Chunk → Document |
| Chunk | Has one embedding | Chunk → Embedding |
| Embedding | Belongs to one | Embedding → Chunk |
| Search Query | Belongs to one | Search Query → User |
| Search Query | Produces many | Search Query → Search Results |
| Search Result | Links to one | Search Result → Chunk |
| RAG Response | Belongs to one | RAG Response → Search Query |
| RAG Response | Cites many | RAG Response → Search Results |
| Conversation | Belongs to one | Conversation → Tenant |
| Conversation | Contains many | Conversation → Search Queries |
| API Key | Belongs to one | API Key → Tenant |
| API Key | Used by many | API Key → Search Queries (programmatic) |
| Invitation | Belongs to one | Invitation → Tenant |
| Invitation → | Invites one | Invitation → User |

**Why:** Relationships define the data ownership and access patterns. The Tenant → User and Tenant → Document relationships enforce the core multi-tenancy isolation — every piece of data traces back to exactly one tenant. The Document → Chunk → Embedding chain models the RAG pipeline. The Search Query → Search Result → Chunk chain shows how retrieval works. The RAG Response chain shows how answers are generated and grounded. These relationships are the foundation of the database schema and the API design.

---

## Q4: How does work flow through the business? (Business Workflows)

**Answer:**

### Workflow 1: Tenant Onboarding

Tenant Admin signs up → Account created → Tenant workspace created → Tenant Admin invites team members → Invitees join → Tenant Admin uploads documents → Documents enter the queue → Background Workers process → Documents become searchable

### Workflow 2: Document Upload and Processing

Tenant Admin uploads a file → System validates format and size → File stored in object storage → Document record created in PostgreSQL (status: Processing) → Background Worker picks up the job → File parsed into text → Text split into chunks → Each chunk sent to OpenAI for embedding → Embeddings stored in Pinecone under tenant namespace → Document status changed to Indexed → Tenant Admin notified

### Workflow 3: Search and Retrieval (RAG Query)

End User logs in → End User asks a natural language question → Query embedded using OpenAI → Vector search performed in Pinecone (tenant-scoped namespace) → Top N relevant chunks retrieved → Chunks sent to LLM with the question → LLM generates an answer grounded in the chunks → Answer + source citations returned to End User → Conversation record updated

### Workflow 4: Tenant Administration

Tenant Admin navigates to dashboard → Tenant Admin uploads a new document → Tenant Admin deletes a document → Document status updated → Chunks and embeddings for that document removed from Pinecone → Database records updated → End User can no longer search that document

### Workflow 5: Team Management

Tenant Admin invites a new user → Invitation email sent → New user accepts invitation → User account created → Linked to the tenant → User gains access to tenant documents → User can search and ask questions

**Why:** Workflows map the real business processes that the system must support. Onboarding is the first workflow a new tenant experiences — getting it right is critical for conversion. Document processing is the core RAG pipeline — if it fails, the product is broken. Search and retrieval is the primary user action — it must be fast and accurate. Administration and team management are the operational workflows that let tenants manage their workspace. Each workflow has clear entry and exit conditions, making it testable and implementable.

---

## Q5: What business rules govern how the system operates?

**Answer:**

| ID | Rule |
|----|------|
| BR-001 | A tenant cannot be deleted if it still has active users |
| BR-002 | A document cannot be searched until its status is "Indexed" |
| BR-003 | A deleted document's chunks and embeddings must be removed from the vector DB |
| BR-004 | An end user can only search within their own tenant's documents |
| BR-005 | An API key can only access its owning tenant's data |
| BR-006 | A user cannot be removed from a tenant if they are the last admin |
| BR-007 | Chunk size must be consistent for a given tenant (default 512 tokens, overlap 50 tokens) |
| BR-008 | Embeddings must be regenerated when a document is re-processed or updated |
| BR-009 | A search query belongs to exactly one tenant (derived from the user) |
| BR-010 | An invitation expires after 7 days if not accepted |
| BR-011 | File upload size cannot exceed 50 MB per file |
| BR-012 | Supported file formats for MVP are PDF, DOCX, and TXT only |
| BR-013 | The RAG response must always include source citations from retrieved chunks |
| BR-014 | Platform admin cannot access tenant document content or search results |
| BR-015 | A tenant's data must be queryable only within that tenant's namespace in Pinecone |

**Why:** Business rules ensure the system operates correctly and safely. Isolation rules (BR-004, BR-005, BR-009, BR-015) are the foundation of multi-tenancy — they prevent data leakage. Lifecycle rules (BR-002, BR-003, BR-008) ensure the RAG pipeline stays consistent — stale or missing embeddings break search quality. Ownership rules (BR-001, BR-006) prevent accidental data loss. Format and size rules (BR-011, BR-012) protect the system from unsupported inputs. The citation rule (BR-013) ensures transparency and trust in RAG answers.

---

## Q6: What external systems does our business depend on?

**Answer:**

| System | Purpose | Interaction Type |
|--------|---------|-----------------|
| OpenAI API | Generate embeddings from text chunks | Sync call during indexing; async for LLM generation |
| Pinecone Cloud | Store vector embeddings; perform similarity search | Sync call for query retrieval |
| SMTP/Email Service | Send tenant invites, notifications | Async (background email delivery) |
| Object Storage (AWS S3) | Store raw uploaded documents | Write on upload; read on re-processing |
| Prisma + PostgreSQL | Store metadata (users, tenants, documents, chunks) | Sync calls for all CRUD operations |
| Next.js Frontend | Serve the web UI | Client-side rendering with API calls |
| FastAPI Backend | Serve the API and orchestrate RAG pipeline | REST API endpoints |
| Docker + Cloud Provider | Host the application | Deployment infrastructure |

**Why:** External systems define the boundaries of our application. OpenAI and Pinecone are critical path dependencies — if either is unavailable, the core RAG feature fails. SMTP is a nice-to-have that enhances the experience. Object storage is the durable file layer. PostgreSQL + Prisma is the relational data layer. The frontend, backend, and cloud provider form the application infrastructure. Understanding each system's role and failure mode is essential for designing resilience.

---

## Q7: What domain assumptions are we making?

**Answer:**

- Each tenant has a single workspace with shared document collections — there is no per-team document scoping within a tenant in MVP.
- Documents are uploaded one at a time and processed sequentially — bulk upload is deferred.
- All users within a tenant share the same document access — there is no per-user permission granularity in MVP.
- Chunk size and overlap are system-wide defaults — per-tenant configuration is deferred.
- Embeddings are generated using OpenAI's text-embedding-ada-002 model — no fallback model.
- Pinecone is the vector database — no self-hosted alternative.
- Users access the platform via web browser only — no mobile, no API-only usage without web UI in MVP.
- Tenants are trusted not to upload copyrighted or sensitive material — no content moderation in MVP.
- Conversations are ephemeral — no history persistence beyond the last session in MVP.
- The RAG pipeline processes documents asynchronously — users do not wait for indexing in real time.

**Why:** Assumptions simplify the MVP. Shared workspace (no team-level scoping) reduces complexity. System-wide defaults for chunk size and embedding model reduce configuration surface area. The ephemeral conversation assumption means we don't need a conversation database schema or history UI. Async processing means the upload-and-search loop is non-blocking. Every assumption has a corresponding Phase 2 or MVP defer item — none are permanent decisions.

---

## Q8: What are the risks at the domain level?

**Answer:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tenant data leakage | Critical | Enforce tenant_id filter on every query; write integration tests for cross-tenant isolation |
| Document processing pipeline failure | High | Implement retry logic in background workers; dead-letter queue for failed jobs |
| Embedding model unavailability | High | Graceful error handling; queue failed documents for retry; alert platform admin |
| Vector DB index corruption | Medium | Periodic consistency checks; rebuild index from source documents if needed |
| Large document processing timeout | Medium | Set chunking timeout; split large documents into parts; progress indicator for admin |
| Pinecone namespace collision | Critical | Validate tenant namespace format; never reuse namespaces; automated namespace cleanup on tenant deletion |
| Business rule changes mid-project | Medium | Version the business rules document; implement rules as configurable policies where possible |

**Why:** Domain risks are about correctness of the business model, not just implementation bugs. Data leakage is a showstopper for a SaaS platform. Pipeline failures directly impact user trust — if documents don't get indexed, the product is broken. Embedding model unavailability is a dependency risk that must be handled gracefully. Pinecone namespace collision is a subtle but catastrophic bug — if two tenants share a namespace, they see each other's data. Each risk has a specific, actionable mitigation.

---

## Q9: Who approves the domain model?

| Role | Name |
|------|------|
| Product Owner | (To be assigned) |
| Business Analyst | (To be assigned) |
| Technical Lead | (To be assigned) |
| Date | (To be set) |

**Why:** Domain model approval ensures the business entities, relationships, and workflows accurately represent real-world operations. The technical lead validates that the model is implementable. Without approval, the design phase proceeds on potentially incorrect assumptions that cascade into the database schema, API design, and code.