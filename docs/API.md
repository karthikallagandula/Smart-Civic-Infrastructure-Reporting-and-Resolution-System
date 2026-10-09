# CivicConnect API Documentation

Base URL (dev): `http://localhost:5000/api`

All responses are JSON. Errors use:
`{ "error": "<message>", "details": [{ "path": "...", "message": "..." }] }`

**Authentication:** send `Authorization: Bearer <token>` for protected routes. The server re-loads the user from
the database on every request — the client's stored role claim is never trusted.

---

## Health

### `GET /health` — public
Returns mode and capability flags.

```json
{
  "status": "ok",
  "demoMode": true,
  "notice": "...",
  "uploadMode": "local-demo" | "cloudinary",
  "aiEnabled": false,
  "demoAccounts": [{ "role": "admin", "email": "...", "password": "..." }],
  "timestamp": "..."
}
```

---

## Authentication

### `POST /auth/register` — public
Body: `{ name, email, password }`
- Password: 8–72 chars.
- **Role is always `citizen`.** A `role` field in the body is ignored (escalation is impossible).
- `201` → `{ token, user: { id, name, email, role, createdAt } }`

### `POST /auth/login` — public
Body: `{ email, password }` → `{ token, user }`. `401` on bad credentials.

### `GET /auth/me` — auth
→ `{ user }`

---

## Citizen reports

### `POST /reports` — auth (citizen)
`multipart/form-data` with fields:

| Field | Required | Notes |
| --- | --- | --- |
| `category` | yes | `pothole \| road_damage \| streetlight \| manhole \| water_leakage \| drainage \| other` |
| `title` | yes | 5–120 chars |
| `description` | yes | 10–2000 chars |
| `severity` | no | `low \| medium \| high` (default `medium`) |
| `latitude`, `longitude` | no | both or neither; lat −90…90, lng −180…180 |
| `address` | no | ≤ 200 chars |
| `image` | no | JPEG/PNG/WebP/GIF ≤ 5 MB |

The server computes a suggested priority (with a human-readable reason) and an auto-suggested department.
Returns `201` → `{ report }` including `complaintId` (e.g. `CC-2026-0013`).

### `GET /reports/my` — auth (citizen)
Optional query: `?status=pending|assigned|in_progress|resolved`
→ `{ reports: Report[], summary: { total, pending, assigned, inProgress, resolved, highPriority } }`

### `GET /reports/:id` — owner or admin
→ `{ report, history: StatusHistory[] }`. `403` for citizens who do not own the report.

---

## Administration (all require `admin` role)

### `GET /admin/reports`
Query parameters (all optional):

| Param | Type |
| --- | --- |
| `q` | text search (ID, title, description, address, citizen) |
| `category`, `status`, `priority`, `department` | equality filters |
| `from`, `to` | created date (ISO) |
| `sort` | `createdAt` (default) · `complaintId` · `title` · `category` · `status` |
| `order` | `asc` / `desc` (default `desc`) |
| `page`, `limit` | pagination (limit ≤ 100) |

→ `{ items: Report[], total, page, limit, totalPages, summary: { total, pending, assigned, inProgress, resolved, highPriority, departments } }`

### `GET /admin/reports/:id`
→ `{ report, history, duplicates: DuplicateMatch[], nextStatuses: Status[] }`

### `PATCH /admin/reports/:id/status`
`multipart/form-data`: `status`, optional `note`, optional `resolutionNote`, optional `resolutionImage`

Valid lifecycle: `pending → assigned → in_progress → resolved`, with allowed rollbacks
(`assigned → pending`, `in_progress → assigned`, `resolved → in_progress`). Everything else → `400`.

- **Resolved** requires a resolution note and automatically sets `resolvedAt`, accepts an after-repair photo,
  and notifies the citizen.
- Every change is recorded in `StatusHistory` (before/after, admin, timestamp, note) and notifies the citizen.
- `400` when attempting an invalid transition.

### `PATCH /admin/reports/:id/assign`
Body: `{ department, team? }`. If the report is `pending`, it is moved to `assigned` (with history + notification).
→ `{ report, statusChanged: boolean }`

### `PATCH /admin/reports/:id/priority`
Body: `{ priority: high|medium|low, reason? }` → sets `prioritySource: "admin"`, appends a timeline note.

### `GET /admin/analytics`
→ `{ generatedAt, totalReports, byStatus, byCategory, byPriority, byDepartment, overTime[30d],
     resolvedVsUnresolved, highPriorityOpen, resolutionRate, averageResolutionHours, recent }`

### `GET /admin/reports/:id/duplicates`
→ `{ duplicates: [{ report, distanceMeters, reason, score }] }` — rule-based (same category and/or within 200 m
and/or overlapping description). The administrator decides what counts as a duplicate.

---

## Notifications

### `GET /notifications` — auth
→ `{ notifications: [], unread }`

### `PATCH /notifications/:id/read` — auth
→ `{ notification }`. Users can only mark their own.

### `PATCH /notifications/read-all` — auth
→ `{ ok: true }`

---

## Optional AI (fallback-safe)

These endpoints never block complaint submission and always return a `source` so you can tell AI from fallback.

### `POST /ai/analyze-image` — auth
`multipart`: `image` (JPEG/PNG/WebP/GIF ≤ 5 MB)
→ `{ suggestedCategory, confidence: number|null, source: "ai"|"keyword-fallback", note, aiEnabled }`

### `POST /ai/assist-text` — auth
Body: `{ text }` (3–3000 chars)
→ `{ title, description, source: "ai"|"rule-fallback", note, aiEnabled }`

Without `AI_API_KEY`, or if the AI call fails, both endpoints transparently return fallback results. AI output is
labelled as a suggestion and is never treated as a confirmed fact (no fabricated locations).

---

## End-to-end verification script (PowerShell / Windows)

Run with the backend on `:5000`:

```powershell
$api = "http://localhost:5000/api"

# 1 health
Invoke-RestMethod "$api/health" | ConvertTo-Json

# 2 register (escalation attempt: role in body is ignored)
Invoke-RestMethod "$api/auth/register" -Method Post -ContentType application/json `
  -Body '{"name":"Test Citizen","email":"test@example.com","password":"Password123","role":"admin"}'

# 3 logins
$admin = Invoke-RestMethod "$api/auth/login" -Method Post -ContentType application/json `
  -Body '{"email":"admin@demo.civicconnect.gov","password":"Admin@1234"}'
$citizen = Invoke-RestMethod "$api/auth/login" -Method Post -ContentType application/json `
  -Body '{"email":"citizen@demo.civicconnect.gov","password":"Citizen@1234"}'
$ah = @{ Authorization = "Bearer $($admin.token)" }
$ch = @{ Authorization = "Bearer $($citizen.token)" }

# 4 citizen → admin endpoint must be 403
try { Invoke-RestMethod "$api/admin/reports" -Headers $ch } catch { "403 expected: $($_.Exception.Response.StatusCode.value__)" }

# 5 create a report (multipart via curl.exe for the image)
$report = Invoke-RestMethod "$api/reports" -Method Post -Headers $ch -ContentType application/json `
  -Body '{"category":"pothole","title":"Large pothole near the market","description":"Deep pothole causing a traffic hazard on the main road","severity":"high","latitude":"12.9750","longitude":"77.6050","address":"Market Road"}'
$report.report.complaintId
$rid = $report.report.id

# 6 assign (auto Pending → Assigned) then move to resolution from citizen's own token check
Invoke-RestMethod "$api/admin/reports/$rid/assign" -Method Patch -Headers $ah -ContentType application/json `
  -Body '{"department":"Roads Department","team":"Crew 1"}'
Invoke-RestMethod "$api/admin/reports/$rid/status" -Method Patch -Headers $ah -ContentType application/json `
  -Body '{"status":"in_progress","note":"Crew dispatched"}'
Invoke-RestMethod "$api/admin/reports/$rid/status" -Method Patch -Headers $ah -ContentType application/json `
  -Body '{"status":"resolved","resolutionNote":"Pothole filled and compacted."}'

# 7 invalid transition must be 400
try { Invoke-RestMethod "$api/admin/reports/$rid/status" -Method Patch -Headers $ah -ContentType application/json -Body '{"status":"pending"}' } catch { "400 expected" }

# 8 citizen sees updated status + notifications
$mine = Invoke-RestMethod "$api/reports/my" -Headers $ch
$mine.summary | ConvertTo-Json
Invoke-RestMethod "$api/notifications" -Headers $ch | ConvertTo-Json

# 9 analytics
Invoke-RestMethod "$api/admin/analytics" -Headers $ah | ConvertTo-Json
```

Related: `frontend/src/services/api.ts` is the exact typed client the UI uses.