# Phase 3 — Development

# Chapter 12 — Testing & Quality Assurance

---

# Objective

The purpose of Testing & Quality Assurance is to verify that the software meets business requirements, functions correctly, and is ready for delivery.

Quality assurance ensures that defects are discovered before reaching the client and that future changes do not break existing functionality.

---

# Why This Phase Exists

Software defects discovered after delivery can cause:

- Client dissatisfaction
- Increased maintenance cost
- Loss of trust
- Project delays

Testing provides confidence that the system behaves as expected.

---

# Testing Strategy

A professional project uses multiple levels of testing.

---

# 1. Unit Testing

Unit testing verifies individual pieces of code.

Examples:

- Services
- Utility functions
- Business rules

Purpose:

Ensure individual components work correctly in isolation.

---

# 2. Integration Testing

Integration testing verifies that multiple components work together.

Examples:

- API + Database
- Authentication + Users
- File Upload + Storage

Purpose:

Validate communication between system components.

---

# 3. End-to-End Testing

End-to-end testing verifies complete user workflows.

Examples:

Vendor Registration:

User registers →

Receives account →

Uploads documents →

Admin approves vendor

Purpose:

Ensure the entire system works from the user's perspective.

---

# 4. Manual Testing

Some scenarios require human verification.

Examples:

- UI usability
- Design consistency
- User experience
- Browser compatibility

---

# Test Cases

Every important feature should have documented test cases.

A test case includes:

- Scenario
- Steps
- Expected Result
- Actual Result
- Status

---

# Bug Management

When defects are discovered, they should be documented.

A bug report should include:

- Description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Severity

---

# Regression Testing

Whenever new features are added, existing functionality should be verified.

Example:

Adding document approval should not break vendor registration.

---

# Performance Testing

Evaluate system behavior under expected load.

Examples:

- API response time
- Database performance
- Concurrent users

---

# Security Testing

Verify:

- Authentication
- Authorization
- Data protection
- Input validation

---

# Best Practices

- Test early, not only before release.
- Automate repetitive tests.
- Maintain test documentation.
- Prioritize critical business workflows.
- Include edge cases.

---

# Exit Criteria

Testing is complete when:

- Critical bugs are resolved.
- Test cases are passed.
- User workflows are verified.
- Performance requirements are met.
- Client acceptance testing is successful.

---

# Deliverables

- Test Plan
- Test Cases
- Bug Reports
- QA Approval

---

# End of Chapter 12