# Data Design Document

---

# 1. Project Information

Project Name:
Healthcare Vendor Management System

Client:
ABC Healthcare Network

Prepared By:
Solution Team

Version:
1.0

Date:
10-Aug-2026

---

# 2. Database Selection

Database:
PostgreSQL

Reason:
The system contains structured relational data, requires transactional consistency, and enforces strong relationships between vendors, users, compliance documents, and approvals.

---

# 3. Entity List

| Entity | Description |
|---------|-------------|
| User | System users |
| Vendor | Vendor companies |
| ComplianceDocument | Uploaded compliance files |
| Approval | Approval or rejection records |
| Hospital | Healthcare organization |

---

# 4. Entity Attributes

## Entity: Vendor

| Field | Data Type | Required | Notes |
|--------|-----------|----------|-------|
| id | UUID | Yes | Primary Key |
| company_name | VARCHAR | Yes | Vendor name |
| registration_number | VARCHAR | Yes | Unique |
| email | VARCHAR | Yes | Unique |
| phone | VARCHAR | Yes | |
| status | ENUM | Yes | Pending, Approved, Rejected |
| created_at | TIMESTAMP | Yes | |

---

## Entity: ComplianceDocument

| Field | Data Type | Required | Notes |
|--------|-----------|----------|-------|
| id | UUID | Yes | Primary Key |
| vendor_id | UUID | Yes | Foreign Key |
| document_type | VARCHAR | Yes | |
| file_url | TEXT | Yes | S3 location |
| expiry_date | DATE | Yes | |
| status | ENUM | Yes | Pending, Approved, Rejected |

---

# 5. Relationships

| Entity A | Relationship | Entity B |
|-----------|--------------|----------|
| Vendor | One-to-Many | ComplianceDocument |
| Vendor | One-to-Many | User |
| ComplianceDocument | One-to-One | Approval |
| Hospital | One-to-Many | Vendor |

---

# 6. Constraints

| Entity | Constraint |
|---------|------------|
| Vendor | Email must be unique |
| Vendor | Registration number must be unique |
| ComplianceDocument | Vendor ID is a required foreign key |
| User | Email must be unique |

---

# 7. Indexing Strategy

| Entity | Indexed Field | Reason |
|---------|---------------|--------|
| Vendor | email | Fast login and lookup |
| Vendor | registration_number | Fast search |
| ComplianceDocument | vendor_id | Retrieve vendor documents |
| ComplianceDocument | status | Dashboard filtering |

---

# 8. Data Integrity Rules

- Every compliance document belongs to exactly one vendor.
- Vendors cannot be deleted while related compliance documents exist.
- Email addresses must be unique.
- Approval records cannot exist without a compliance document.

---

# 9. ERD Notes

The database follows a normalized relational design.

Core relationships:

Hospital
└── Vendors
    ├── Users
    └── Compliance Documents
          └── Approval

A visual ERD should accompany this document using a diagramming tool.

---

# 10. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor indexing | Medium | Review query patterns |
| Changing business rules | Medium | Version database migrations |

---

# 11. Approval

Database Designer:
Sarah Johnson

Technical Lead:
Adnan Ayaz

Client:
ABC Healthcare Network

Date:
10-Aug-2026