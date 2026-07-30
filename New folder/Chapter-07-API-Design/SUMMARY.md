# Phase 2 — Design

# Chapter 07 — API Design

---

# Objective

The purpose of API Design is to define the communication contract between clients and the backend system.

This document specifies the available endpoints, request formats, response structures, authentication requirements, validation rules, and error responses before implementation begins.

A well-designed API enables frontend and backend teams to work independently while reducing integration issues.

---

# Why This Phase Exists

Without an API specification, frontend and backend developers often make different assumptions.

For example:

Frontend expects:

GET /vendors?page=1

Backend implements:

GET /vendor/list?pageNumber=1

This leads to delays and unnecessary rework.

The API Design document ensures everyone agrees on the interface before development starts.

---

# Topics Covered

## API Style

Choose the communication style.

Examples:

- REST
- GraphQL
- gRPC

---

## Resource Design

Identify the primary resources exposed by the API.

Examples:

- Users
- Vendors
- Documents
- Approvals

---

## Endpoint Definitions

Each endpoint should define:

- HTTP Method
- URL
- Purpose
- Authentication
- Request Body
- Response
- Status Codes

---

## Authentication

Document how clients authenticate.

Examples:

- JWT
- OAuth
- API Keys

---

## Validation

Specify input validation rules.

Examples:

- Required fields
- Length limits
- Allowed values
- File restrictions

---

## Error Handling

Define a consistent error response format.

Examples:

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 500 Internal Server Error

---

## Versioning

Specify how API versions will be managed.

Example:

/api/v1/

---

# Best Practices

- Use resource-based URLs.
- Use correct HTTP methods.
- Return consistent response formats.
- Keep naming consistent.
- Version APIs.
- Document authentication requirements.

---

# Exit Criteria

The phase is complete when:

- Core endpoints are documented.
- Authentication is defined.
- Validation rules are documented.
- Error responses are standardized.
- API contract is approved.

---

# Deliverable

API Specification

---

# End of Chapter 07