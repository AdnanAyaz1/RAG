                    INGESTION
──────────────────────────────────────────
1. Document Upload
2. Document Parsing
3. Document Cleaning
4. Document Structuring
5. Chunking
6. Metadata Extraction
7. Embedding Generation
8. Storage

                    QUERY
──────────────────────────────────────────
9. Query Understanding
10. Query Transformation

                  RETRIEVAL
──────────────────────────────────────────
11. Retrieval
12. Filtering
13. Reranking
14. Context Expansion
15. Context Compression
16. Context Assembly

                 GENERATION
──────────────────────────────────────────
17. Prompt Construction
18. LLM Generation
19. Structured Output

                VALIDATION
──────────────────────────────────────────
20. Grounding
21. Guardrails
22. Evaluation

                OBSERVABILITY
──────────────────────────────────────────
23. Monitoring
24. Experimentation
25. Optimization


Phase 1 — Ingestion Pipeline

This happens once when a document enters the system.

1. Document Upload
Purpose

Receive knowledge from the user.

Examples

PDF
DOCX
Markdown
CSV
PPTX
HTML

Methods

Single upload
Batch upload
API
Cloud storage sync
2. Document Parsing
Purpose

Convert files into readable text and structured content.

Methods

PDF parsers
OCR
Office document parsers
HTML parsers
3. Document Cleaning
Purpose

Remove unnecessary information.

Examples

Headers
Footers
Empty pages
Duplicate whitespace
Page numbers

Methods

Rule-based cleaning
AI-assisted cleaning
4. Document Structuring
Purpose

Understand document organization.

Examples

Headings
Sections
Tables
Lists
Images
Code blocks

Methods

Rule-based
Layout-aware parsing
AI parsing
5. Chunking
Purpose

Split documents into retrievable units.

Methods

Fixed-size
Recursive
Semantic
Heading-aware
Parent-child
Sliding window
6. Metadata Extraction
Purpose

Extract searchable attributes.

Examples

Author
Source
Department
Category
Date
Tags
Permissions

Methods

Rule-based
AI extraction
7. Embedding Generation
Purpose

Convert chunks into vectors.

Methods

OpenAI embeddings
BGE
E5
Voyage
Jina
Other embedding models
8. Storage
Purpose

Store everything required for retrieval.

Usually includes

Raw document
Clean text
Chunks
Metadata
Embeddings
Phase 2 — Query Pipeline

Runs every time the user asks a question.

9. Query Understanding
Purpose

Understand user intent.

Methods

Intent classification
Language detection
Query analysis
10. Query Transformation
Purpose

Improve the query before searching.

Methods

Query expansion
Rewrite
Synonym generation
Multi-query
HyDE
Phase 3 — Retrieval Pipeline
11. Retrieval
Purpose

Find relevant information.

Methods

Vector search
BM25
Hybrid search
Graph retrieval
SQL retrieval
12. Filtering
Purpose

Reduce search space.

Methods

Metadata filtering
Permission filtering
Date filtering
Category filtering
13. Reranking
Purpose

Improve retrieval precision.

Methods

Cross-encoder rerankers
LLM reranking
Rule-based reranking
14. Context Expansion
Purpose

Retrieve additional supporting information.

Methods

Parent-child retrieval
Neighbor chunks
Graph traversal
15. Context Compression
Purpose

Reduce token count while preserving meaning.

Methods

Sentence extraction
AI summarization
Redundancy removal
16. Context Assembly
Purpose

Build the final context sent to the model.

Methods

Priority ordering
Deduplication
Token budgeting
Phase 4 — Generation Pipeline
17. Prompt Construction
Purpose

Build the final prompt.

Methods

Templates
Dynamic prompts
Role prompts
Chain-of-thought prompts (when appropriate)
18. LLM Generation
Purpose

Generate the answer.

Methods

Single model
Multi-model routing
Agentic generation
19. Structured Output
Purpose

Return machine-readable responses.

Methods

JSON Schema
Function calling
Structured parsers
Phase 5 — Validation Pipeline
20. Grounding
Purpose

Verify that the answer is supported by retrieved evidence.

Methods

Citation checks
Evidence comparison
Self-verification
21. Guardrails
Purpose

Enforce safety and business rules.

Methods

Input validation
Output validation
Policy enforcement
22. Evaluation
Purpose

Measure pipeline quality.

Methods

Human evaluation
Automated benchmarks
RAG metrics
Phase 6 — Operations
23. Monitoring
Purpose

Track system health.

Methods

Logs
Metrics
Traces
Dashboards
24. Experimentation
Purpose

Compare different approaches.

Methods

A/B testing
Prompt comparison
Embedding comparison
Chunking experiments
25. Optimization
Purpose

Continuously improve the platform.

Methods

Caching
Model routing
Index optimization
Cost optimization
Latency optimization
The Big Picture
Upload
    │
    ▼
Parse
    │
    ▼
Clean
    │
    ▼
Structure
    │
    ▼
Chunk
    │
    ▼
Metadata
    │
    ▼
Embeddings
    │
    ▼
Storage
═══════════════════════════════
Question
    │
    ▼
Understand
    │
    ▼
Transform
    │
    ▼
Retrieve
    │
    ▼
Filter
    │
    ▼
Rerank
    │
    ▼
Expand
    │
    ▼
Compress
    │
    ▼
Assemble
    │
    ▼
Prompt
    │
    ▼
LLM
    │
    ▼
Validate
    │
    ▼
Response
One suggestion before we proceed

I'd like us to follow the same engineering process we used for CareerOS:

Meeting 1: Agree on the complete architecture (today).
Meeting 2 onward: Take one stage at a time and study it deeply.
For each stage, we'll answer:
Why does it exist?
What problems does it solve?
What are the available methods?
Beginner implementation.
Production implementation.
Trade-offs.
How we'll implement it in RAG Lab.

That way, by the end, you won't just know how to build a RAG system—you'll understand why every component exists and when to use it.
