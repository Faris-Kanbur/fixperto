# Fixperto Backend

Express + SQLite REST API for the Fixperto demo (mechanics, owners, vehicles, appointments, car listings, job listings, support tickets, admin).

## Setup

```bash
npm install
npm run dev      # starts on http://localhost:4000 with auto-reload
```

The SQLite database file is created automatically at `db/fixperto.sqlite` on first run and seeded with the same demo data the original frontend prototype used to hardcode.

## Endpoints

All entity endpoints follow the same REST shape:

```
GET    /api/mechanics
GET    /api/mechanics/:id
POST   /api/mechanics
PATCH  /api/mechanics/:id
DELETE /api/mechanics/:id
```

Same pattern for `/api/owners`, `/api/vehicles`, `/api/appointments`, `/api/listings`, `/api/jobs`, `/api/tickets`.

Admin-specific:

```
POST /api/admin/login          { email, password } -> { ok }
GET  /api/admin/stats          platform-wide counters
GET  /api/admin/change-log     audit trail
POST /api/admin/change-log     write an audit entry
```

Default admin login: `admin@fixperto.com` / `Fixperto2026!` (override via `.env`, see `.env.example`).

## Notes

This backend was generated to replace the in-memory mock data of the original single-file React demo with real persistence. The frontend's more complex mutation flows (accept/reject appointment, offer negotiation, quote requests, notifications, etc.) still run client-side as they did before — only the core entities are now backed by real REST endpoints + SQLite. Wiring every remaining mutation to persist server-side is a natural next step once you're ready to extend this further.
