# ADR-003: Use the Facade Pattern for the Trip and Reservation Flow

**Status:** Accepted (implemented in `backend/src/facade/`)

## Context
The main user flow (create a trip, search trips, reserve a seat) spans two backend modules: `trips` and `reservations`. Before this change, each router imported its own module's service, and the HTTP layer had to know which service and which function belongs to each step. Adding a new step to the flow would require changes in several routers.

## Decision
Introduce `TripReservationFacade` (Facade pattern from the course) with three methods used by the flow: `createTrip()`, `searchTrips()` and `reserveSeat()`. The Express routers call the facade; the facade delegates to `TripService` and `ReservationService`. The facade contains no business rules and no database access. The services are injected through its constructor, and `facade/index.js` wires the real implementations.

Participating components:
- Client: `trips/routes.js`, `reservations/routes.js`
- Facade: `TripReservationFacade`
- Subsystem: `TripService` (-> `TripRepository`), `ReservationService` (-> Supabase RPC `reserve_seat`)

## Alternatives considered
1. Routers call the services directly (previous state): fewer files, but the flow is spread over two routers and each client must know both services.
2. One large service for trips and reservations: removes the delegation but mixes two responsibilities and breaks the module boundaries from ADR-001.

## Consequences
**Positive:** one simple entry point for the flow; services stay unchanged and independent; the facade is unit-tested with fake services (no Supabase, no network).

**Negative:** one extra layer of delegation; only the three flow operations go through the facade, other endpoints (get, update, cancel trip, list/cancel reservations) still call their services directly. Keep the facade free of business logic, otherwise it becomes a "god object".

## Relationship to other decisions
ADR-002 (atomic `reserve_seat` in PostgreSQL) is unchanged: the facade only forwards the call.
