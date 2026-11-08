# ADR-001: Use a layered modular monolith with a single PostgreSQL database

**Status:** Proposed

## Context
A small team must deliver trip creation, search, seat reservation and notifications in limited time. Reservations must stay consistent (no double booking) and access to other users' data must be blocked. Milestone 1 requires search results within 3 s (95% of searches) and strict access control for private reservation data.

## Decision
Build one backend application with clearly separated modules (Identity, Trips, Reservations, Notifications, Moderation) and layers (API, application service, domain, data access), backed by one relational database. Modules use each other only through public interfaces; direct access to another module's tables is forbidden. E-mail sending runs in a separate Notification Worker that reads a notification queue stored in the same database.

## Alternatives considered
1. Microservices with one database per service.
2. Monolith without module boundaries (all code and tables freely shared).

## Consequences
**Positive**
- Simple development and deployment.
- Reservations use ordinary database transactions.
- One place for authorization checks.
- Fast search without inter-service calls.
- Modules can later be split into services if needed.

**Negative**
- One backend failure affects all functions (mitigated by running several instances).
- Parts cannot be scaled independently.
- Module boundaries are kept by review discipline; nothing enforces them automatically.
