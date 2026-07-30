# Phase 1 — Understand the Client

# Chapter 02 — Requirements Engineering

---

# Objective

Requirements Engineering is the process of transforming the client's ideas, discussions, and business needs into clear, complete, and actionable software requirements.

The purpose of this phase is to ensure everyone involved in the project has a shared understanding of what the software should do before design and development begin.

A well-written requirements document reduces misunderstandings, prevents unnecessary rework, and serves as the foundation for planning, design, implementation, testing, and client acceptance.

---

# Why This Phase Exists

Clients typically describe business problems rather than software behavior.

For example:

"We need a system where vendors can submit compliance documents."

While this explains the goal, it does not provide enough detail for implementation.

The development team must clarify:

- Who can submit documents?
- What document types are supported?
- Can documents be edited after submission?
- Who reviews them?
- What happens after approval or rejection?
- Should expired documents trigger notifications?

Requirements Engineering answers these questions before coding begins.

---

# Types of Requirements

## Functional Requirements

Functional requirements describe the features and behaviors the software must provide.

Examples:

- User Registration
- User Login
- Vendor Profile Management
- Document Upload
- Compliance Approval
- Search Vendors

---

## Non-Functional Requirements

Non-functional requirements define the quality attributes of the system.

Examples:

- Performance
- Availability
- Security
- Scalability
- Accessibility
- Maintainability

---

## Business Rules

Business rules define policies that govern how the business operates.

Examples:

- Vendors cannot become active until approved.
- Compliance certificates must have an expiry date.
- Only administrators can archive vendors.
- Every vendor must belong to one organization.

---

## Constraints

Constraints are project limitations that influence implementation.

Examples:

- Budget
- Timeline
- Technology stack
- Compliance regulations
- Existing systems

---

## Assumptions

Assumptions are statements accepted as true until confirmed otherwise.

Examples:

- Every vendor has one primary contact.
- Administrators are employees of the client.
- All users have access to email.

Assumptions should always be validated during the project.

---

# Requirement Characteristics

Good requirements should be:

- Clear
- Complete
- Consistent
- Testable
- Feasible
- Prioritized
- Traceable

---

# Best Practices

- Use simple language.
- Avoid implementation details.
- Write one requirement per statement.
- Number every requirement.
- Validate requirements with stakeholders.
- Separate facts from assumptions.

---

# Exit Criteria

This phase is complete when:

- Functional requirements are approved.
- Non-functional requirements are documented.
- Business rules are agreed upon.
- Constraints are identified.
- Stakeholders approve the document.

---

# Deliverable

Software Requirements Specification (Lightweight)

---

# End of Chapter 02