# ADR-002: Execute Seat Reservations as Atomic PostgreSQL Operations

**Status:** Accepted (implemented in `db/schema.sql`)

## Context
Multiple passengers can attempt to reserve the last available seat concurrently. Reading the seat count in a Node.js service and then writing a reservation in separate database requests risks overbooking or inconsistent counts. A passenger must not reserve their own trip, and notifications should be recorded when the reservation succeeds.

## Decision
Keep reservation coordination inside the `public.reserve_seat(p_trip_id uuid)` PostgreSQL function, invoked from the Reservations service via the Supabase client RPC API. The function validates the authenticated user, locks the selected trip row with `SELECT ... FOR UPDATE`, rejects unavailable or full trips and the trip's driver, inserts the reservation, decrements `seats_available`, and inserts a pending notification within a single database transaction. PostgreSQL RLS and token-scoped requests complement this business rule.

## Alternatives considered
1. Separate application-side `SELECT`, `INSERT`, and `UPDATE` operations: may race and require additional coordination.
2. Serialize reservations in an external queue: more infrastructure and operational complexity for a single-database prototype.

## Consequences
**Positive:** serialized concurrent attempts on the same trip row; state changes are atomic; clear business-rule failures; notification record is committed with the reservation.

**Negative:** database-specific PL/pgSQL logic is less portable; locking can create contention during high demand; real concurrency protection must be validated by an integration test rather than mocked JavaScript unit tests alone.

## Verification and known limitation
The repository contains the SQL function and Node.js RPC call. Unit tests with mocked Supabase responses validate API behavior, but do **not** prove concurrency safety. The `unique (trip_id, passenger_id)` constraint also means that a cancelled passenger cannot create a fresh reservation for the same trip without an explicit rebooking policy/change. Document this as a future business-rule decision.

## Relationship to other decisions
The reservation call reaches this function through `TripReservationFacade` (see ADR-003). The facade only delegates; the transactional logic stays in `reserve_seat`.
