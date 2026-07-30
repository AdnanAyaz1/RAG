# Phase 2 — Design

# Chapter 06 — Data Design

---

# Objective

The purpose of Data Design is to transform the business entities identified during Domain Modeling into a structured database design.

This phase defines what data will be stored, how it will be organized, and how different entities relate to one another.

A well-designed data model improves data integrity, simplifies development, and supports future scalability.

---

# Why This Phase Exists

The business model explains **what exists** in the business.

The data model explains **how that information will be stored**.

For example:

Business Entity:
Vendor

Data Model:

- id
- company_name
- email
- phone
- status
- created_at

Without proper data design, developers may create inconsistent tables, duplicate information, or violate business rules.

---

# Topics Covered

## Database Selection

Choose the database technology based on project requirements.

Examples:

- PostgreSQL
- MySQL
- MongoDB

---

## Entity Definitions

Identify every entity that requires persistent storage.

Examples:

- User
- Vendor
- Document
- Approval
- Hospital

---

## Attributes

List the important fields for every entity.

Examples:

Vendor

- id
- company_name
- registration_number
- email
- status

---

## Relationships

Define how entities connect.

Examples:

- One-to-One
- One-to-Many
- Many-to-Many

---

## Constraints

Define rules that the database must enforce.

Examples:

- Primary Keys
- Foreign Keys
- Unique Constraints
- Required Fields

---

## Indexing Strategy

Identify fields that should be indexed to improve query performance.

Examples:

- email
- vendor_id
- status

---

## Data Integrity

Ensure the database enforces business rules wherever possible.

Examples:

- Required fields
- Unique email addresses
- Referential integrity

---

# Best Practices

- Normalize data where appropriate.
- Avoid unnecessary duplication.
- Use meaningful table and column names.
- Enforce constraints at the database level.
- Plan indexes based on expected queries.

---

# Exit Criteria

The phase is complete when:

- Entities are defined.
- Relationships are established.
- Constraints are documented.
- Indexes are identified.
- The ERD is approved.

---

# Deliverables

- Entity Relationship Diagram (ERD)
- Data Dictionary

---

# End of Chapter 06