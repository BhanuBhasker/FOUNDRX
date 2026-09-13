# FOUNDRX

**Discover Builders. Build Startups.** — a startup co-founder matching and team formation platform, built to the
project's Final Blueprint v1.0.

FOUNDRX's main differentiator is **Dual Discovery**: users can discover both compatible **Builders** and active
**Startup Opportunities**. A transparent, rule-based compatibility score (never a black-box ML model) drives every
match, and accepted collaborations flow into real startups, projects, and milestones.

## Tech stack

| Layer            | Technology                                  |
|-------------------|----------------------------------------------|
| Frontend           | React 18 (Vite), React Router, Context API, Tailwind CSS |
| Charts             | Recharts                                     |
| Backend / API      | Node.js + Express                            |
| Database           | MySQL 8 (raw SQL via `mysql2`, no ORM)       |
| Auth               | Email/password (bcrypt + JWT) **and** Google Sign-In (Google Identity Services) |
| Testing            | Vitest + React Testing Library (frontend), Node's built-in test runner (backend) |

## The main journey

```
PROFILE → DISCOVER (Builders / Startups) → MATCH or APPLY → COLLABORATE → FORM TEAM → BUILD STARTUP → MANAGE PROJECT
```

## Project structure

```
FOUNDERX/
├── database/              # Schema, views, stored procedures/functions, triggers, seed data
│   ├── schema.sql          # 15 tables, matching Blueprint §6
│   ├── views.sql
│   ├── procedures.sql      # fn_calculate_profile_completion, sp_accept_application (ACID)
│   ├── triggers.sql
│   └── seed.sql
├── server/                 # Express REST API — mirrors Blueprint §7's endpoint map
│   └── src/
│       ├── config/         # env + MySQL pool
│       ├── middleware/      # auth, validation, error handling
│       ├── validators/      # Zod request schemas
│       ├── models/          # raw SQL query functions, one file per entity
│       ├── services/        # compatibility scoring (Blueprint §9 weights), JWT issuing
│       ├── controllers/     # request handlers
│       └── routes/          # Express routers, one per resource
└── client/                  # React (Vite) frontend — mirrors Blueprint §8's component map
    └── src/
        ├── api/              # one thin wrapper per REST resource
        ├── context/          # Auth + Toast providers
        ├── hooks/            # useDebounce, useAsync
        ├── components/       # layout / ui / profile / startup / charts / auth
        ├── pages/            # one file per route (see the route table below)
        └── routes/           # ProtectedRoute / AdminRoute guards
```

## Pages ↔ routes (Blueprint §5)

| Page | Route |
|---|---|
| Landing | `/` |
| Login / Register | `/login`, `/register` |
| Profile Onboarding (5-step wizard) | `/onboarding` |
| Discover Builders | `/discover/builders` |
| Builder Profile | `/builders/:userId` |
| Discover Startup Opportunities | `/discover/startups` |
| Startup Details | `/startups/:startupId` |
| Create Startup | `/startups/new` |
| Applications & Collaboration (Received / Sent / Startup Applications) | `/applications` |
| Project Details (+ milestones) | `/projects/:projectId` |
| Personal Dashboard | `/dashboard` |
| Analytics | `/dashboard/analytics` |
| Admin (minimal: users, startups, skills, platform stats) | `/admin` |

## 1. Prerequisites

- Node.js 18+
- A running MySQL 8 server
- A Google Cloud OAuth 2.0 **Web** client ID (for Google Sign-In) — optional, email/password auth works without it

## 2. Database setup

1. Copy `server/.env.example` to `server/.env` and fill in your MySQL credentials.
2. From the repo root, run:

   ```bash
   npm install
   npm run db:setup
   ```

   This applies, in order: `schema.sql`, `views.sql`, `procedures.sql`, `triggers.sql`, `seed.sql`.

## 3. Google Sign-In setup (optional but supported end-to-end)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID**
   of type **Web application**, with `http://localhost:5173` as an authorized JavaScript origin.
2. Put the client ID into `server/.env` → `GOOGLE_CLIENT_ID` and `client/.env` (copy from `.env.example`) →
   `VITE_GOOGLE_CLIENT_ID`.

The backend verifies the Google ID token server-side with `google-auth-library` before issuing its own session JWT.

## 4. Run the app

```bash
npm run dev:server   # http://localhost:5000 (or PORT from server/.env)
npm run dev:client   # http://localhost:5173
```

Register an account, then promote it to admin directly in MySQL to explore the admin dashboard:

```sql
UPDATE Users SET user_role = 'admin' WHERE email = 'you@example.com';
```

## 5. Tests

```bash
npm test --workspace client   # Vitest + React Testing Library
cd server && npm test          # Node's built-in test runner (compatibility scoring)
```

## How this matches the Blueprint

- **Dual Discovery**: `GET /api/discover/builders` and `GET /api/discover/startups` are separate, independently
  filterable endpoints (`server/src/controllers/discover.controller.js`), backing two distinct pages.
- **Compatibility weights are exactly Blueprint §9**: Complementary Skills 30%, Shared Interests 25%,
  Availability 15%, Experience Compatibility 15%, Role Complementarity 10%, Startup Goal Match 5%
  (`server/src/services/compatibility.service.js`, unit-tested). "Complementary" skills are measured as the
  fraction of a candidate's skill *categories* you don't already have — the point of a co-founder search is
  finding someone who fills your gaps, not a clone of yourself.
- **`fn_calculate_profile_completion(user_id)`** (Blueprint §10.4) is a real MySQL `FUNCTION`, kept separate from
  the `UPDATE`-issuing procedure per MySQL's rule that a trigger can't modify the table that fired it.
- **`sp_accept_application`** (Blueprint §10.3/§10.6) is one `START TRANSACTION … COMMIT`/`ROLLBACK` procedure:
  it validates the request, flips its status, adds the right person to `StartupMembers`, and writes a
  notification — generalized across all three `Applications.type` values (`cofounder_request`,
  `startup_application`, `team_invitation`).
- **`active_startup_opportunities` view, indexes, and triggers** match Blueprint §10.1/§10.2/§10.5 by name and
  intent.
- **Applications is one unified resource** (`GET /api/applications?direction=&type=&status=`,
  `PUT /api/applications/:id/status`), backing the Received / Sent / Startup Applications tabs in one screen.
- **Kept beyond the v1.0 "must-have" list, since they were already built and don't conflict**: Google Sign-In and
  post-collaboration Reviews — both listed under the Blueprint's "Future Version" as *deferred*, not *disallowed*.
