# Chapter 06 — Data Design

---

# Objective

The purpose of Data Design is to transform the business entities identified in the domain model into a structured database design. This phase defines what data will be stored, how it will be organized, and how different entities relate to one another in PostgreSQL and Pinecone.

---

# Q&A

## Q1: What database technologies are selected?

**Answer:**

**Primary Database:** PostgreSQL (metadata storage)
**Reason:** PostgreSQL is the right choice for structured relational data — tenants, users, documents, conversations, API keys, and invitations all require relational integrity, transactional guarantees, and complex querying. Prisma ORM provides type-safe access from our TypeScript-FastAPI stack. PostgreSQL also supports native JSON columns for flexible metadata.

**Vector Database:** Pinecone Cloud
**Reason:** Pinecone is a managed vector database purpose-built for similarity search. It supports namespace-level isolation (one namespace per tenant), which maps directly to our multi-tenancy requirement. We do not need to manage infrastructure, scaling, or replication. Pinecone handles all vector operations — indexing, querying, filtering — and scales independently of PostgreSQL.

**File Storage:** AWS S3
**Reason:** S3 provides durable, cheap, scalable object storage for raw uploaded documents. We store files here so they can be re-processed if needed — e.g., if chunk size or the embedding model changes. S3 also provides versioning and lifecycle policies.

**Why:** We use three storage systems because each excels at a different data type. PostgreSQL is the source of truth for relational data. Pinecone is optimized for vector similarity search in milliseconds. S3 is cheap durable storage for binary files. This separation is intentional and deliberate.

---

## Q2: What are the entity definitions (database tables)?

**Answer:**

### PostgreSQL Tables

| Table | Description |
|-------|-------------|
| tenants | Organizations using the platform |
| users | People with accounts, belongs to one tenant |
| documents | Uploaded files, belongs to one tenant |
| chunks | Subdivided pieces of a document |
| conversations | Search sessions per tenant |
| messages | Individual questions and answers in a conversation |
| api_keys | Tenant-scoped API keys for programmatic access |
| invitations | Tokens for inviting new users to a tenant |

### Pinecone Index

| Field | Description |
|-------|-------------|
| id | Unique chunk identifier |
| values | Vector embedding (1536 dimensions) |
| metadata | tenant_id, document_id, chunk_index, content_preview |

**Why:** The PostgreSQL schema stores relational metadata — who belongs to what, which documents exist in which tenant, conversation history, API keys. The Pinecone index stores vector data with namespace isolation — each tenant namespace contains only that tenants chunk embeddings. We store content_preview in Pinecone metadata (first 200 chars) so we can display search results without a second database query to PostgreSQL. This denormalization is intentional and read-only.

---

## Q3: What are the table attributes?

**Answer:**

### tenants

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| name | VARCHAR(255) | Yes | Organization name |
| slug | VARCHAR(100) | Yes | Unique URL-friendly identifier |
| plan | VARCHAR(50) | Yes | free, pro, enterprise |
| settings | JSONB | Yes | Tenant-level config |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |
| is_active | BOOLEAN | Yes | Default true |

### users

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| tenant_id | UUID | Yes | Foreign Key to tenants.id |
| email | VARCHAR(255) | Yes | Unique within tenant |
| password_hash | VARCHAR(255) | Yes | bcrypt hashed |
| role | VARCHAR(50) | Yes | tenant_admin, end_user |
| display_name | VARCHAR(255) | Yes | |
| created_at | TIMESTAMP | Yes | |
| is_active | BOOLEAN | Yes | Default true |

### documents

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| tenant_id | UUID | Yes | Foreign Key to tenants.id |
| original_filename | VARCHAR(500) | Yes | File name as uploaded |
| s3_key | TEXT | Yes | S3 object key |
| file_size | INTEGER | Yes | In bytes |
| mime_type | VARCHAR(100) | Yes | application/pdf, etc. |
| status | VARCHAR(50) | Yes | uploaded, processing, indexed, failed, archived |
| total_chunks | INTEGER | No | Number of chunks after processing |
| error_message | TEXT | No | If processing failed |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

### chunks

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| document_id | UUID | Yes | Foreign Key to documents.id |
| tenant_id | UUID | Yes | Denormalized for query filtering |
| chunk_index | INTEGER | Yes | Position in document |
| content | TEXT | Yes | The actual text chunk |
| token_count | INTEGER | Yes | For tracking costs and limits |
| created_at | TIMESTAMP | Yes | |

### conversations

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| tenant_id | UUID | Yes | Foreign Key to tenants.id |
| title | VARCHAR(500) | No | Auto-generated from first question |
| created_at | TIMESTAMP | Yes | |
| updated_at | TIMESTAMP | Yes | |

### messages

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| conversation_id | UUID | Yes | Foreign Key to conversations.id |
| tenant_id | UUID | Yes | Denormalized for query filtering |
| role | VARCHAR(50) | Yes | user or assistant |
| content | TEXT | Yes | The question or answer text |
| search_query | TEXT | No | The embedded query (for user messages) |
| source_chunks | JSONB | No | Array of chunk IDs and citations |
| created_at | TIMESTAMP | Yes | |

### api_keys

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| tenant_id | UUID | Yes | Foreign Key to tenants.id |
| key | VARCHAR(255) | Yes | The actual API key (hashed) |
| key_prefix | VARCHAR(8) | Yes | First 8 chars for identification |
| is_active | BOOLEAN | Yes | Default true |
| last_used_at | TIMESTAMP | No | |
| created_at | TIMESTAMP | Yes | |

### invitations

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | UUID | Yes | Primary Key |
| tenant_id | UUID | Yes | Foreign Key to tenants.id |
| email | VARCHAR(255) | Yes | Email of invited user |
| token | VARCHAR(255) | Yes | Unique invitation token |
| role | VARCHAR(50) | Yes | tenant_admin, end_user |
| expires_at | TIMESTAMP | Yes | 7 days from creation |
| accepted_at | TIMESTAMP | No | |
| created_at | TIMESTAMP | Yes | |

**Why:** Every table includes tenant_id for query-level isolation — even if a bug bypasses application-level tenant checks, the database itself can reject cross-tenant queries. The users table has a unique constraint on email scoped to tenant_id — two tenants can have the same email address. The documents status lifecycle mirrors the RAG pipeline states. Denormalizing tenant_id into chunks and messages avoids expensive joins when filtering by tenant in the RAG retrieval path.

---

## Q4: What are the entity relationships?

**Answer:**

| Entity A | Relationship | Entity B |
|----------|-------------|----------|
| Tenant | One-to-Many | User |
| Tenant | One-to-Many | Document |
| Tenant | One-to-Many | Conversation |
| Tenant | One-to-Many | API Key |
| Tenant | One-to-Many | Invitation |
| User | Belongs to one | Tenant |
| Document | Belongs to one | Tenant |
| Document | One-to-Many | Chunk |
| Chunk | Belongs to one | Document |
| Chunk | Mapped to | Embedding (Pinecone) |
| Conversation | Belongs to one | Tenant |
| Conversation | One-to-Many | Message |
| Message | Belongs to one | Conversation |
| User | Creates many | Conversation |
| API Key | Belongs to one | Tenant |
| Invitation | Belongs to one | Tenant |
| Invitation | Invites one | User (upon acceptance) |

**Why:** Every entity traces back to exactly one Tenant through direct or indirect relationships — this is the foundation of multi-tenancy isolation. Chunk to Document is a parent-child relationship where a document is meaningless without its chunks. Conversation to Message is a temporal relationship — a conversation grows over time. The Invitation to User relationship is a soft one — the invitation creates a user upon acceptance, and once accepted, the user belongs directly to the tenant. The Chunk to Embedding mapping in Pinecone is a cross-database relationship — PostgreSQL tracks chunk metadata, Pinecone stores vector values.

---

## Q5: What database constraints enforce business rules?

**Answer:**

| Table | Constraint | Purpose |
|-------|-----------|---------|
| tenants | UNIQUE(slug) | Tenant slugs must be unique for URL routing |
| users | UNIQUE(tenant_id, email) | Same email allowed across different tenants, not twice in one tenant |
| users | NOT NULL(tenant_id, email, role) | Core fields cannot be missing |
| documents | NOT NULL(tenant_id, original_filename, status) | A document must belong to a tenant |
| documents | CHECK(status in uploaded, processing, indexed, failed, archived) | Status enum enforcement |
| chunks | NOT NULL(document_id, tenant_id, chunk_index, content) | Every chunk must have content |
| chunks | UNIQUE(document_id, chunk_index) | No duplicate chunk indexes in a document |
| messages | CHECK(role in user, assistant) | Role enum enforcement |
| api_keys | UNIQUE(key_prefix) | API key prefixes must be unique |
| Foreign Keys | users.tenant_id -> tenants.id etc. | Referential integrity |
| Foreign Keys | chunks.document_id -> documents.id | A chunk cannot exist without a parent document |
| Tenant Isolation | tenant_id on every table | Every query can be scoped to a single tenant |

**Why:** Database constraints are the last line of defense for data integrity. The CHECK constraints on status and role prevent invalid values that would break the RAG pipeline or RBAC logic. The composite unique constraint on users(tenant_id, email) allows the same email across tenants while preventing duplicates within a single tenant. The tenant_id on every table is the safety net — even if application-level tenant scoping fails, the database can reject cross-tenant queries.

---

## Q6: What is the indexing strategy?

**Answer:**

| Table | Indexed Field(s) | Reason |
|-------|-------------------|--------|
| users | (tenant_id, email) | Fast login scoped to tenant |
| users | tenant_id | List all users in a tenant |
| documents | (tenant_id, status) | Find unindexed documents for workers |
| documents | (tenant_id, created_at) | List recent documents in dashboard |
| chunks | (tenant_id, document_id) | Retrieve all chunks for a document |
| chunks | (tenant_id, chunk_index) | Order chunks back into document sequence |
| conversations | (tenant_id, updated_at) | List recent conversations |
| messages | (conversation_id, created_at) | Load conversation history chronologically |
| api_keys | key_prefix | Identify API key in logs |
| invitations | token | Fast lookup when user clicks invite link |
| tenants | slug | URL routing — resolve tenant from path |
| Pinecone | Vector index (built-in) | Cosine similarity over 1536-dim vectors |

**Why:** Every index serves a specific query pattern identified from the application workflows. The (tenant_id, email) composite index on users matches the login flow — given a tenant and email, find the user in O(log n). The Pinecone vector index is automatically managed by Pinecone using HNSW for approximate nearest neighbor search. No indexes are speculative — each one maps to an actual query pattern from our domain model.

---

## Q7: What are the data integrity rules?

**Answer:**

- Every user belongs to exactly one tenant. A users tenant cannot be changed without re-validating all their data access.
- Every document belongs to exactly one tenant. Documents cannot be transferred between tenants.
- Every chunk belongs to exactly one document and one tenant (tenant_id is denormalized for query performance).
- Embeddings in Pinecone are indexed under the tenants namespace — no chunk from another tenant can ever appear in search results.
- Embeddings must be regenerated whenever the source documents content changes or the document is re-processed.
- Deleting a document must cascade to deleting its chunks and removing their embeddings from Pinecone.
- Conversation data is tenant-scoped — an admin from tenant A cannot read conversations from tenant B.
- API keys are tenant-scoped and include a hashed version of the key for lookup — the raw key is never stored.
- Invitation tokens are single-use and expire after 7 days.
- A tenant cannot be soft-deleted while it still has active users or indexed documents.
- S3 objects for documents are deleted when the document is archived or deleted from the platform.
- The tenant_id on every table acts as a safety net — the application layer should enforce it, but the database layer can serve as a fallback.

**Why:** Data integrity rules ensure the multi-tenant platform is consistent and secure. The cascade rules prevent orphaned records in Pinecone or S3 when documents are deleted — dangling vectors or orphaned objects waste money and create confusion. The tenant_id on every table is a defense-in-depth strategy — it is both a logical design choice (correctness) and a security measure (isolation).

---

## Q8: What are the data storage notes?

**Answer:**

PostgreSQL handles all relational data with full ACID compliance. Prisma manages migrations and provides type-safe queries.

Pinecone handles vector storage with namespace-per-tenant isolation. Each tenant gets a unique namespace. Chunks are upserted into Pinecone as the document is processed. When a document is updated or deleted, its namespace is cleared and re-indexed.

S3 handles raw file storage. Files are stored with keys following the pattern {tenant_id}/{document_id}/{original_filename}. This structure makes it easy to list all files for a tenant and delete all files for a tenant when it is removed.

The content_preview stored in Pinecone metadata (first 200 characters of each chunk) is a deliberate denormalization to avoid a second database query when rendering search results in the UI.

**Why:** Each storage system has a specific responsibility and data lifecycle. PostgreSQL is the primary source of truth with transactional guarantees. Pinecone is optimized for read-heavy vector similarity queries. S3 is an append-friendly durable store for binary files. The key structure in S3 enforces tenant-level organization at the storage layer and makes bulk deletion straightforward. The Pinecone metadata denormalization is a performance optimization that trades a small amount of storage for a significant reduction in query latency for search results.

---

## Q9: What are the risks at the data design level?

**Answer:**

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-tenant Pinecone namespace leakage | Critical | Validate namespace format; never reuse namespaces; automated namespace cleanup on tenant deletion |
| Orphaned S3 objects after document deletion | Medium | Implement lifecycle hook that deletes S3 objects when document status changes to archived |
| Database row-level tenant isolation bypass | Critical | Write integration tests for every query path; use Prisma middleware to inject tenant_id filter automatically |
| PostgreSQL performance at scale | Medium | Proper indexing, connection pooling via Prisma, read replicas when needed |
| Embedding drift from model version changes | Medium | Store embedding model version in document metadata; re-process all chunks when model is upgraded |
| S3 data exposure | High | Bucket policies restrict access to application role only; no public access; encryption at rest |

**Why:** Data design risks are about correctness at the storage layer. Cross-tenant Pinecone leakage is the most dangerous bug — it breaks the core multi-tenancy promise and could cause legal liability. Orphaned S3 objects waste money but do not break functionality. A tenant isolation bypass at the database layer would be the hardest bug to detect since it requires testing every query path. Embedding drift means the system serves less accurate results after a model upgrade — re-processing all chunks is the safe but costly fix.

---

## Q10: Who approves the data design?

| Role | Name |
|------|------|
| Database Designer | (To be assigned) |
| Technical Lead | (To be assigned) |
| Date | (To be set) |

**Why:** Data design approval ensures the schema accurately represents the domain model and supports the required query patterns correctly. A poorly designed data model creates technical debt that is expensive to fix later. Approval from the technical lead validates that the schema is implementable and performant.

---

# End of Chapter 06
