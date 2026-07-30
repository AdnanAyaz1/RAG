# Production RAG System Architecture — Complete Module Guide

## Overview

Retrieval Augmented Generation (RAG) is not a single technique. A production-grade RAG system is a collection of interconnected modules responsible for:

1. Understanding user intent
2. Processing and structuring knowledge
3. Retrieving relevant information
4. Filtering incorrect information
5. Providing safe and grounded answers
6. Continuously improving through feedback

A weak RAG system usually fails because one of these modules is poorly designed.

A production RAG pipeline looks like:

```
User Query
    |
    v
1. Query Understanding
    |
    v
2. Query Transformation
    |
    v
3. Retrieval Strategy
    |
    v
4. Vector Search
    |
    v
5. Keyword Search
    |
    v
6. Hybrid Retrieval Fusion
    |
    v
7. Reranking
    |
    v
8. Context Optimization
    |
    v
9. Prompt Construction
    |
    v
10. Generation
    |
    v
11. Evaluation & Guardrails
    |
    v
12. Feedback & Continuous Improvement
```

---

# Module 1 — Document Ingestion

## Purpose

The first stage converts raw information into a format that the RAG system can understand.

Examples:

* PDFs
* Medical documents
* Research papers
* Websites
* Word documents
* Database records

---

## Scenarios

### Scenario 1: Simple Text Documents

Example:

```
Company policies
FAQs
Documentation
```

Approach:

* Extract text
* Clean formatting
* Store content

Works well because information is already structured.

---

### Scenario 2: Complex Documents

Example:

Medical papers:

```
Disease
 |
 Symptoms
 |
 Diagnosis
 |
 Treatment
 |
 Contraindications
```

Simple extraction destroys relationships.

---

## Problems

### Bad extraction causes:

* Missing tables
* Broken headings
* Incorrect ordering
* Lost relationships

Example:

Original:

```
Drug A

Used for:
Hypertension

Avoid:
Pregnancy
```

After extraction:

```
Drug A Hypertension Pregnancy
```

The meaning changes.

---

## Preferred Production Approach

Use structure-aware extraction.

Store:

```
{
 content:"",
 metadata:{
   document:"",
   section:"",
   page:"",
   heading:""
 }
}
```

Recommended:

* Unstructured.io
* LlamaParse
* Custom PDF parsers

---

# Module 2 — Chunking Strategy

## Purpose

Large documents must be divided into smaller pieces before embedding.

LLMs cannot efficiently process unlimited context.

---

# Chunking Approaches

## 1. Fixed Size Chunking

Example:

```
Every 1000 characters
```

Advantages:

* Simple
* Fast

Problems:

Breaks meaning.

Example:

```
Symptoms:
High fever
Chest pain
```

might become:

Chunk 1:

```
Symptoms:
High fever
```

Chunk 2:

```
Chest pain
Treatment:
```

Context lost.

---

## 2. Recursive Chunking

Splits based on:

```
Paragraph
Sentence
Words
Characters
```

Better than fixed chunking.

---

## 3. Semantic Chunking

Understands meaning.

Example:

Medical:

```
Section:
Symptoms

Section:
Treatment
```

kept together.

---

## Preferred Approach

Production systems usually use:

```
Structure-aware semantic chunking
+
10-20% overlap
+
metadata preservation
```

Example:

```
Chunk:
{
text:"Hypertension treatment...",
metadata:{
section:"Treatment",
disease:"Hypertension"
}
}
```

---

# Module 3 — Embedding Generation

## Purpose

Convert text into numerical representations.

Example:

```
"Heart attack"

        |
        v

[0.123,0.432,0.982....]
```

Similar meanings produce similar vectors.

---

## Scenarios

### Semantic Search

User:

```
medicine for high blood pressure
```

Document:

```
Hypertension medication
```

Vector similarity connects them.

---

## Problems

Embeddings do not understand:

* Exact codes
* Numbers
* Rare terminology

Example:

```
ICD-10: I10
```

may not retrieve correctly.

---

## Preferred Approach

Choose embeddings based on domain.

General:

* OpenAI embeddings
* BGE embeddings

Medical:

* Biomedical embeddings

---

# Module 4 — Vector Database

## Purpose

Stores embeddings and performs similarity search.

Examples:

* Pinecone
* Qdrant
* Weaviate
* pgvector

---

## Scenarios

Question:

```
What causes diabetes?
```

Vector search finds:

```
Diabetes symptoms
Diabetes causes
Insulin resistance
```

---

## Drawbacks

Vector search struggles with:

### Exact matching

Example:

```
Find drug XZ-102
```

### Numbers

Example:

```
Dosage 500mg
```

### Codes

Example:

```
ICD-10 E11.9
```

---

## Preferred Approach

Never use vector search alone.

Use hybrid retrieval.

---

# Module 5 — Keyword Retrieval (BM25)

## Purpose

Traditional search based on words.

Excellent for:

* Names
* Codes
* Exact phrases

---

## Scenario

Query:

```
Metformin 500mg dosage
```

BM25 finds exact matches.

---

## Drawbacks

Does not understand meaning.

Example:

Query:

```
heart attack symptoms
```

Document:

```
myocardial infarction signs
```

BM25 may miss it.

---

## Preferred Approach

Combine:

```
Vector Search
+
BM25
```

---

# Module 6 — Hybrid Retrieval

## Purpose

Combine semantic and keyword search.

Architecture:

```
              Query

              |

       ----------------
       |              |
   Vector Search   BM25 Search

       |              |

       ---------------

             Fusion
```

---

## Benefits

Handles:

Semantic queries:

```
How does diabetes affect kidneys?
```

AND

Exact queries:

```
ICD E11.9
```

---

## Preferred Method

Reciprocal Rank Fusion (RRF)

Example:

Vector result:

```
Document A rank 1
```

BM25:

```
Document A rank 3
```

Combined:

```
Document A becomes highest
```

---

# Module 7 — Query Transformation

## Purpose

Improve user questions before retrieval.

---

## Scenario

User:

```
MI symptoms
```

System transforms:

```
Myocardial infarction symptoms,
heart attack warning signs,
cardiac emergency symptoms
```

---

## Techniques

## Query Expansion

Adds synonyms.

---

## Multi Query Retrieval

Creates multiple searches.

Original:

```
kidney disease medication
```

Creates:

```
CKD treatment
renal medication
kidney failure drugs
```

---

## Drawbacks

Too much expansion creates noise.

---

## Preferred Approach

Use controlled expansion.

---

# Module 8 — Reranking

## Purpose

Retrieval gives many candidates.

Reranking selects the best ones.

Flow:

```
Retrieve 50 documents

        |

Reranker

        |

Top 5 documents
```

---

## Problems Without Reranking

Relevant documents may appear lower.

---

## Preferred Models

* Cohere Rerank
* BGE Reranker

---

## Benefits

* Higher accuracy
* Less LLM context
* Lower cost

---

# Module 9 — Context Optimization

## Purpose

Prepare retrieved information before sending to LLM.

---

## Problems

Too much context:

```
100 pages
```

causes:

* Higher cost
* Confusion
* Lost information

---

## Techniques

### Context Compression

Remove unnecessary information.

---

### Deduplication

Remove repeated chunks.

---

### Metadata Filtering

Example:

Only retrieve:

```
Disease = Diabetes
Section = Treatment
```

---

## Preferred Approach

Retrieve:

```
20-50 chunks

Rerank

Send top 5-10
```

---

# Module 10 — Prompt Engineering

## Purpose

Control LLM behavior.

---

## Poor Prompt

```
Answer this question.
```

Problem:

Model may hallucinate.

---

## Production Prompt

```
You are a medical assistant.

Answer only using provided context.

If information is missing:
say you don't know.

Provide sources.
```

---

## Preferred Approach

Include:

* Role
* Rules
* Context
* Output format
* Safety instructions

---

# Module 11 — Generation Layer

## Purpose

The LLM creates the final answer.

---

## Responsibilities

* Explain information
* Summarize
* Reason
* Format response

---

## Problems

Even with RAG:

LLMs can hallucinate.

Example:

Retrieved:

```
No evidence available
```

Model:

```
creates fake treatment
```

---

## Preferred Approach

Use:

* Temperature control
* Strict prompts
* Citation requirements
* Validation layer

---

# Module 12 — Evaluation, Monitoring & Feedback

## Purpose

A production RAG system must continuously improve.

---

## Evaluation Metrics

## Retrieval Metrics

### Recall

Did we retrieve the correct document?

---

### Precision

Are retrieved documents relevant?

---

## Generation Metrics

### Faithfulness

Is answer supported by context?

---

### Answer Relevance

Does answer solve the question?

---

## Monitoring

Track:

* Failed searches
* User feedback
* Hallucinations
* Latency
* Cost

---

## Preferred Production Approach

Implement:

```
User Feedback

       |

Evaluation Pipeline

       |

Improve Retrieval
```

---

# Production RAG Recommended Architecture

```
                User

                 |

        Query Understanding

                 |

        Query Transformation

                 |

       ---------------------
       |                   |
   Vector Search       BM25 Search
       |                   |
       ---------------------
              Hybrid Fusion

                    |

              Reranker

                    |

          Context Optimization

                    |

              Prompt Builder

                    |

                  LLM

                    |

              Evaluation Layer

                    |

               Feedback Loop
```

---

# Final Production Recommendations

## Avoid

❌ Vector-only search
❌ Fixed-size chunking everywhere
❌ Sending huge context to LLM
❌ No evaluation system
❌ No metadata filtering

---

## Prefer

✅ Structure-aware chunking
✅ Hybrid retrieval
✅ Reranking
✅ Metadata filtering
✅ Query expansion
✅ Context compression
✅ Evaluation pipeline
✅ Continuous feedback loop

---

A production RAG system is not about choosing an LLM. The quality comes from the engineering around retrieval, ranking, and validation.

---

# Use in Our Project

This reference guide informs the following decisions in our Multi-Tenant RAG SaaS:

| Decision | Chapter Reference | Rationale |
|----------|-------------------|-----------|
| Structure-aware chunking with metadata | Ch 6 (Data Design), Ch 7 (API Design) | Preserves document section info for better retrieval |
| Hybrid retrieval (vector + keyword) | Ch 7 (API Design), Ch 10 (Core Modules) | Handles both semantic and exact-match queries |
| Metadata filtering by tenant namespace | Ch 7, Ch 9, Ch 11 (Deployment) | Enforces tenant isolation at retrieval level |
| Reranking before LLM generation | Ch 11 (Deployment) - future phase | Reduces LLM cost and improves accuracy |
| Context optimization (compress, dedup, filter) | Ch 10 (Core Backend Modules) | Keeps LLM context focused and cost-effective |
| Source citation in every answer | Ch 2 (Requirements), Ch 7 (API Design) | Builds trust and enables verification |
| Evaluation pipeline | Ch 12 (Testing, QA) | Continuous improvement through feedback |
| Feedback loop | Ch 12 (Testing, QA) | User ratings feed back into retrieval quality |

---

# End of RAG Reference Architecture
