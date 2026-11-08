# Milestone 3 Architecture Evidence — Summary

## Implemented scenario
A verified SDU user creates a trip via the React frontend; another student searches and reserves a seat. Express routes call `TripReservationFacade`, which delegates to the Trips/Reservations business services. Supabase PostgreSQL stores trip and reservation data. `reserve_seat` performs seat locking, validation, insertion and decrement in one transaction, and appends a notification record.
A verified SDU user creates a trip via the React frontend; another student searches and reserves a seat. Express routes call Trips/Reservations business services. Supabase PostgreSQL stores trip and reservation data. `reserve_seat` performs seat locking, validation, insertion and decrement in one transaction, and appends a notification record.

## Differences from Milestone 2
- Architecture remains a layered modular monolith; the database remains PostgreSQL.
- Technology choices are now explicit: React + Vite + CSS frontend; Node.js + Express backend; Supabase PostgreSQL / Supabase Auth; Node.js + Nodemailer worker.
- Database-level reservation logic and RLS are shown explicitly, based on implemented `db/schema.sql`.
- Supabase Auth and SMTP are shown as supporting external capabilities, not additional business microservices.
- ADR-001 status is updated from Proposed to Accepted; ADR-002 documents the atomic booking decision.

## Evidence and limitations
- Code paths: `frontend/src/api.js`, `backend/src/app.js`, `backend/src/facade`, `backend/src/modules/trips`, `backend/src/modules/reservations`, `backend/src/middleware/auth.js`, `backend/src/config/supabase.js`, `db/schema.sql`, `worker/src/index.js`.
- Component diagram depicts the booking feature specifically, not every system module.
- Design pattern: Facade (`backend/src/facade/`), see ADR-003. Unit tests: `backend/src/facade/TripReservationFacade.test.js`.
- Code paths: `frontend/src/api.js`, `backend/src/app.js`, `backend/src/modules/trips`, `backend/src/modules/reservations`, `backend/src/middleware/auth.js`, `backend/src/config/supabase.js`, `db/schema.sql`, `worker/src/index.js`.
- Component diagram depicts the booking feature specifically, not every system module.
- Diagram represents the code in the supplied project archive; verify any later commits before final submission.
- Course design pattern requirement is separate; Repository Pattern alone is not one of the seven patterns listed by the student.
