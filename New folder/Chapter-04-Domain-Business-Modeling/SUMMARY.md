# Phase 2 — Design

# Chapter 04 — Domain & Business Modeling

---

# Objective

Domain & Business Modeling transforms the client's requirements into a clear understanding of how the business operates.

The goal is not to design the database or APIs.

Instead, this phase identifies the business entities, actors, workflows, relationships, and business rules that define the problem domain.

A correct domain model ensures that the software reflects the client's business rather than simply storing data.

---

# Why This Phase Exists

Clients think in terms of their business.

Developers often think in terms of databases.

If development begins by creating database tables, important business concepts are often missed.

This phase helps the development team understand:

- Who interacts with the system.
- What objects exist in the business.
- How those objects relate to each other.
- What actions users perform.
- What rules govern the business.

Only after understanding the domain should technical design begin.

---

# Core Concepts

## Actors

Actors are the people or systems that interact with the application.

Examples:

- Vendor
- Administrator
- Compliance Officer
- External System

---

## Business Entities

Entities represent important business objects.

Examples:

- Vendor
- Compliance Document
- Hospital
- Approval
- User

Entities should reflect the business, not the database.

---

## Relationships

Define how entities interact.

Examples:

- A Vendor uploads many Documents.
- A Compliance Officer reviews many Documents.
- A Hospital manages many Vendors.

---

## Business Workflows

Describe how work flows through the business.

Examples:

Vendor Registration

↓

Document Submission

↓

Compliance Review

↓

Approval

↓

Vendor Activation

---

## Business Rules

Business rules define how the business operates.

Examples:

- Vendors cannot become active until approved.
- Expired compliance documents require renewal.
- Every vendor belongs to one organization.

---

# Best Practices

- Use business terminology.
- Avoid technical implementation details.
- Validate the model with stakeholders.
- Focus on understanding the business rather than the software.

---

# Exit Criteria

This phase is complete when:

- Business actors are identified.
- Core entities are defined.
- Relationships are understood.
- Business workflows are documented.
- Business rules are validated.

---

# Deliverable

Domain & Business Model Document

---

# End of Chapter 04