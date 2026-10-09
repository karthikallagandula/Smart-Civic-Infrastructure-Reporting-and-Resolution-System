# CivicConnect — Smart Civic Infrastructure Reporting & Resolution System

A full-stack prototype aligned with **UN SDG 9 (Industry, Innovation and Infrastructure)** that lets citizens report
damaged public infrastructure — potholes, broken streetlights, open manholes, leaking pipelines, drainage problems —
with **photos and GPS locations**, and lets civic authorities **prioritise, assign, track and resolve** every
complaint with a complete audit trail.

> **Demo mode first.** The application installs and runs with **no external services** and seeds realistic sample data.
> MongoDB Atlas and Cloudinary are fully supported when configured — see [Configuration](#3-configuration).

---

## 1. Feature summary

**Citizens**

- Register / log in (public registration can **never** create an administrator — role is forced server-side)
- Report issues with: category, severity, title, description, photo upload, GPS or map-picked location, address
- See an auto-suggested priority with a human-readable reason (rule-based, admin-overridable), plus a success
  screen with a unique reference number such as `CC-2026-0013`
- Dashboard with live statistics and recent complaints
- Track every complaint through **Pending → Assigned → In Progress → Resolved** with a full timeline
- Compare the original photo with the after-repair photo; read resolution notes
- In-app notifications on submit, assign, status change and resolution

**Administrators / Civic authority**

- Dedicated console with summary cards (total, pending, assigned, in-progress, resolved, high-priority)
- Complaint management table with **search, sorting, pagination and filters**
- Interactive **OpenStreetMap** (Leaflet) with priority-coloured markers, filters and popups → open detail
- Full complaint view: photo, exact coordinates, map, description, status history, department, team
- Assign to departments/teams, override suggested priority (with reason), record progress notes, move status
  through valid transitions only, resolve with an after-repair photo + resolution note
- Possible-duplicate detection for nearby/same-category reports (administrator decides)
- **Recharts analytics**: by category, status, priority, department, over time, resolved vs unresolved,
  resolution rate and average resolution time

**Engine / integrity**

- Transparent rule-based **priority triage** (category risk + citizen severity + safety keywords + proximity to
  sensitive places) — labelled as a *suggestion*, never a safety determination
- Strict server-side lifecycle transitions and RBAC on every route; inputs validated with Zod
- Rate limiting, helmet, secure CORS, bcrypt password hashing, JWT sessions
- **Optional AI** (image category suggestion + description assistance) with a rule-based fallback — the app stays
  fully functional with no AI key
- Clearly labelled **demo mode** when MongoDB / Cloudinary are not configured

---

## 2. Tech stack

| Layer     | Technology                                                      |
| --------- | --------------------------------------------------------------- |
| Frontend  | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide icons, React Router 7, Leaflet/OpenStreetMap, Recharts |
| Backend   | Node.js, Express, TypeScript, Zod, JWT, bcryptjs, multer        |
| Data      | MongoDB Atlas (Mongoose) with an in-memory **demo fallback**     |
| Storage   | Cloudinary image uploads with a **local demo** fallback          |
| Optional  | Any OpenAI-compatible vision chat-completions endpoint for AI image/text assistance |

---

## 3. Configuration

Copy `.env.example` to `.env` **or** to `backend/.env` (the backend checks the project root first, then its own
folder). Variable names only are committed — never real secrets.

| Variable | Purpose | If left empty |
| --- | --- | --- |
| `PORT` | Backend port (default `5000`) | – |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `JWT_SECRET` | Token signing secret (use a long random value) | Uses a dev-only value; **set this in production** |
| `MONGODB_URI` | MongoDB Atlas connection string | **Demo mode**: in-memory sample data |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Cloudinary credentials | Local demo uploads under `backend/uploads` |
| `AI_API_KEY` | OpenAI-compatible API key | Rule-based fallback for AI features |
| `AI_BASE_URL`, `AI_MODEL` | Chat-completions endpoint + model | OpenAI `gpt-4o-mini` |
| `SEED_DEMO` | Seed demo data in demo mode | `true` |

---

## 4. Install & run

Requires **Node.js 18+** (Node 20/22 recommended).

```bash
# from the project root
npm install                 # root tooling (concurrently)
npm run install:all         # installs backend and frontend dependencies
npm run dev                 # starts backend :5000 and frontend :5173 together
```

Then open **http://localhost:5173**.

Run each side separately if preferred:

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

### Demo accounts (demo mode only)

These exist **only** when running without MongoDB and are surfaced on the login page for evaluators:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@demo.civicconnect.gov` | `Admin@1234` |
| Administrator | `authority@demo.civicconnect.gov` | `Admin@1234` |
| Citizen | `citizen@demo.civicconnect.gov` | `Citizen@1234` |
| Citizen | `priya@demo.civicconnect.gov` | `Citizen@1234` |

Demo sample data: **12 sample complaints** across all categories, priorities and statuses around Bengaluru,
with matching status histories and notifications. Sample records are flagged `isDemo` and the UI shows a demo
banner. Demo records never mix with real records unless you connect a database and restart.

---

## 5. Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs backend + frontend in watch mode |
| `npm run build` | Type-checks and builds both apps |
| `npm start` | Starts the **built** backend (`backend/dist`) |
| `npm run typecheck` | `tsc --noEmit` on backend and frontend |
| `npm run build --prefix frontend` | Production build of the React app |
| `npm run build --prefix backend` | Production build of the API |

---

## 6. API overview

Base URL: `http://localhost:5000/api`. Full documentation in [`docs/API.md`](docs/API.md).

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | Register (always citizen) |
| POST | `/auth/login` | public | Log in |
| GET | `/auth/me` | user | Current user |
| POST | `/reports` | citizen | Create complaint (multipart: fields + optional `image`) |
| GET | `/reports/my` | citizen | My complaints + summary |
| GET | `/reports/:id` | owner/admin | Complaint detail + history |
| GET | `/admin/reports` | admin | Filter/sort/paginate complaints + summary |
| GET | `/admin/reports/:id` | admin | Detail + history + duplicates + allowed next states |
| PATCH | `/admin/reports/:id/status` | admin | Status change (multipart, optional `resolutionImage`) |
| PATCH | `/admin/reports/:id/assign` | admin | Assign department/team (auto-assign if pending) |
| PATCH | `/admin/reports/:id/priority` | admin | Override priority |
| GET | `/admin/analytics` | admin | Analytics payload |
| GET | `/admin/reports/:id/duplicates` | admin | Possible duplicates |
| GET | `/notifications` | user | Notifications + unread count |
| PATCH | `/notifications/:id/read` | user | Mark one read |
| PATCH | `/notifications/read-all` | user | Mark all read |
| POST | `/ai/analyze-image` | user | Optional AI image → category suggestion (never blocks) |
| POST | `/ai/assist-text` | user | Optional AI/fallback description tidy-up |
| GET | `/health` | public | Mode, upload mode, AI status, demo accounts |

Security notes: JWTs are verified and the user is **re-read from the database on every request**; the role, user ID,
priority and status supplied by the client are never trusted without server-side checks. See `docs/API.md`.

---

## 7. Testing

Automated contract tests use `curl` / `PowerShell`. In [`docs/API.md`](docs/API.md) there is a copy-paste script
that verifies:

1. Health + demo mode
2. Registration (and that a `role: "admin"` body still creates a citizen — escalation blocked)
3. Login (admin + citizen)
4. Report creation → reference number → persistence
5. Admin assignment (auto Pending → Assigned) and status flow → Resolved with note
6. Invalid transitions rejected (e.g. Pending → Resolved throws 400)
7. Citizen access to admin endpoints → 403; foreign report access → 403; no token → 401
8. Image upload (Cloudinary or local demo) and image fetch
9. AI analyze/assist endpoints in fallback mode
10. Validation error responses (400 with details)
11. Analytics and notifications payloads

Run once manually via Postman/`curl` or the script in `docs/API.md`. For a UI walk-through:

- Register a citizen and submit a report with photo + GPS.
- Log in as an administrator, open the complaint, assign it, move it to **In Progress**, then **Resolved** with an
  after-repair photo and note.
- Log back in as the citizen: check the status timeline, resolution photo, and the notification bell.
- Explore the map (filter markers) and the analytics page.

---

## 8. Deployment

**Backend** (Render / Railway / Fly.io / any Node host):

1. `npm run build` at the root (or per package).
2. Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, Cloudinary/AI vars, and
   `MONGODB_URI` must point to your Atlas cluster.
3. Start with `npm start` (runs `backend/dist/index.js`).
4. If using the local-upload fallback, the host must persist `backend/uploads` (or use Cloudinary).

**Frontend** (Vercel / Netlify / any static host):

1. `npm run build --prefix frontend` → `frontend/dist`.
2. Serve it, and point `/api` and `/uploads` to the backend (configure a rewrite/proxy on the host, or set
   `VITE_API_TARGET`-style env if you extend the client). The bundled Vite dev server already proxies both.

**MongoDB Atlas**: create a cluster, allow your host IPs, use the SRV URI, and replace `SEED_DEMO` usage — demo
data is never written to Atlas (only used in demo mode).

---

## 9. Project structure

```
civicconnect/
├── .env.example
├── README.md
├── docs/API.md
├── backend/
│   └── src/
│       ├── config/       # env, db init, cloudinary
│       ├── controllers/  # auth, reports, admin, notifications, AI
│       ├── middleware/   # auth, error, upload, rate limits
│       ├── repo/         # data layer: memory (demo), mongo, seed
│       ├── routes/       # API routes
│       ├── services/     # priority, status flow, analytics, storage, AI, duplicates
│       ├── utils/        # errors, helpers
│       ├── validators/   # Zod schemas
│       ├── app.ts / index.ts
│       └── types.ts
├── frontend/
│   └── src/
│       ├── components/   # badges, map, timeline, status cards, etc.
│       ├── contexts/     # auth + toast
│       ├── hooks/        # geolocation, debounce
│       ├── layouts/      # dashboard + auth shells
│       ├── pages/        # landing, auth, citizen + admin screens
│       ├── services/     # typed API client
│       ├── utils/        # constants/labels/formatters
│       ├── App.tsx / main.tsx / types.ts
```

---

## 10. Honest limitations

- **Demo mode** stores data in memory only — it resets on restart and never claims to persist remotely. Demo
  records are labelled `isDemo`.
- **Local image mode** saves uploads under `backend/uploads` (labelled in the UI); it is not permanent remote
  storage. Configure Cloudinary for production.
- **AI is optional and truthfully labelled.** Without a key, category suggestions are keyword-based and text
  assistance is a plain tidy-up; the UI says so, and submissions never depend on AI.
- Priority suggestions are heuristic and must be reviewed by authorities; the system does **not** claim to judge
  danger from photos.
- No email/push notifications or password-reset flows (MVP scope) — in-app notifications are provided.
```