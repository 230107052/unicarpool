# University Carpooling System (UniCarpool)

## Problem summary
Getting to university can be inconvenient for students without a car, or whose public transport does not match their schedule. At the same time, some students drive to university with empty seats. There is no simple place where students can find each other and arrange a shared trip.

Our system connects students who need a ride with students who can offer one. A user can create a trip, search for trips, reserve a seat, and see basic information about the driver and trip. Out of scope: payments, taxi services, car rental, full GPS navigation.

## Team
| Full name | Student ID | GitHub |
|---|---|---|
| Arsen Rakhymzhan| 230107014 | Senchik01 |
| Azamat Mauiya | 230118001 | igengraw |
| Razbekov Alisher | 230107052 | 230107052 |
| Beisen Adilov | 220103323| beysen-nr |

## Architecture
Layered modular monolith with 4 containers: **Web App** (React) -> **Backend API** (Node.js/Express) -> **Database** (Supabase PostgreSQL), plus a **Notification Worker** (Node.js).

![Container diagram](docs/architecture/container-diagram.png)

- Decision records: [ADR-001](docs/adr/ADR-001-modular-monolith.md), [ADR-002](docs/adr/ADR-002-atomic-seat-reservation.md), [ADR-003](docs/adr/ADR-003-facade-pattern.md)
- Rules: the browser talks only to our Backend API (never directly to Supabase); the Backend queries the database *as the signed-in user*, so Row Level Security protects data even if our code has a bug; the `service_role` key lives only in `backend/.env` / `worker/.env` and is never committed.

## Repository structure
```
db/schema.sql        tables, functions, triggers, Row Level Security (run in Supabase)
docs/                architecture diagram, ADRs, milestone documents
frontend/            Web App (React + Vite + CSS)
backend/src/modules/ identity, trips, reservations, notifications, moderation
backend/src/facade/  TripReservationFacade (Facade pattern for create/search/reserve)
worker/              Notification Worker (sends queued e-mails)
```
Each backend module has layers: `routes.js` (API) -> `service.js` (application rules) -> `repository.js` / Supabase (data access). Modules expose only `index.js`.

## Getting started (VS Code)
Requirements: Node.js 18+, Git, a free Supabase project.

1. **Supabase**: create a project -> SQL Editor -> run `db/schema.sql`. In *Authentication -> Providers -> Email* keep "Confirm email" enabled. Copy the Project URL, `anon` key and `service_role` key from *Project Settings -> API*.
2. **Backend**: `cd backend && cp .env.example .env` (fill in values, set `UNIVERSITY_EMAIL_DOMAIN`), then `npm install && npm run dev` (http://localhost:3000, check `/health`).
3. **Frontend**: `cd frontend && npm install && npm run dev` (http://localhost:5173).
4. **Worker**: `cd worker && cp .env.example .env && npm install && npm run dev` (without SMTP settings e-mails are printed to the console).
5. Tests: `cd backend && npm test`.
6. Make an administrator: register, then run the commented `update public.profiles set role = 'admin' ...` line at the end of `db/schema.sql`.

## Team workflow
- Never push directly to `main`. Create a branch (`feature/<topic>`), commit often with clear messages, open a Pull Request, another member reviews it.
- Never commit `.env` files or keys (they are in `.gitignore`).
- Every member should own at least one real feature, see the open TODOs in the code (`grep -r TODO backend frontend`).
