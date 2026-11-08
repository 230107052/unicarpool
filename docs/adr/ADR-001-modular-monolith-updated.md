# ADR-001: Use a Layered Modular Monolith with a Single PostgreSQL Database

**Status:** Accepted (implemented for Milestone 3 prototype)

## Context
UniCarpool must support verified student access, trip creation and search, seat reservations, moderation, and notifications. The small team needs maintainable modules and correct reservation consistency without distributed transactions.

## Decision
Keep a single Node.js + Express Backend API, separated into Identity, Trips, Reservations, Notifications, and Moderation modules, with a React + Vite frontend and a separate Node.js notification worker. Use Supabase PostgreSQL as the system of record. Authorization runs at the API boundary, with Supabase Auth for identity and PostgreSQL RLS as additional data-access protection. Reservation changes are executed in PostgreSQL functions.

## Alternatives considered
1. Independent microservices with separate databases: substantially more deployment and consistency complexity.
2. Unstructured monolith: easier initially, but makes module ownership and changes harder.

## Consequences
**Positive:** one API deployment; simpler local development and debugging; one PostgreSQL transaction for seat reservation; isolated module boundaries.

**Negative:** backend availability affects all API modules; modules cannot scale independently; boundaries depend on team discipline. The notification worker and its SMTP integration require separate configuration.

## Milestone 2 to Milestone 3 update
Architecture style is unchanged. Milestone 3 identifies actual technology choices: React/Vite/CSS, Node.js/Express, Supabase PostgreSQL (including Supabase Auth/RLS and database RPC), and a Node.js/Nodemailer notification worker. The container diagram now makes Supabase Auth and SMTP integration explicit. This ADR updates the status from Proposed to Accepted because the architecture is represented in the submitted prototype code. Availability and performance targets from earlier milestones have not yet been independently load-tested.
