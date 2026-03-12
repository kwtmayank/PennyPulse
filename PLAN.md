## Penny Pulse Implementation Plan (Execution-Ready)

### Summary
Implement Penny Pulse as a monorepo with:
1. `client/` React + TypeScript + Vite + PWA (mobile-first UI)
2. `server/` Node.js + Express + MongoDB Atlas
3. Auth system (register/login/logout/email verify/forgot password with code)
4. Finance features (transactions, recurring rules, dashboard, categories)
5. Deployment targets: Vercel (`client`), Render (`server`), Atlas DB, `/health` uptime ping support

### Implementation Changes
1. **Monorepo foundation**
- Create root layout: `client/`, `server/`, root `package.json`, `.gitignore`, `.env.example`, `README.md`.
- Root scripts orchestrate both apps (`dev`, `build`, `test`, `lint`) and keep shared tooling only.
- Keep environment files separated (`client/.env`, `server/.env`) with placeholders only in committed examples.

2. **Backend (`server`)**
- Bootstrap Express app with middleware: JSON parser, cookie parser, CORS allowlist, error handler.
- Add Mongo connection module with startup validation for `MONGODB_URI`.
- Implement `/health` endpoint returning `{ ok, service, version, timestamp, uptimeSec }` with no DB dependency.
- Define Mongoose models:
  - `User`: firstName, lastName, userId (unique), email (unique), mobile optional, passwordHash, emailVerified, timestamps.
  - `EmailVerificationCode`: userId/email, codeHash, expiresAt, attempts, purpose (`signup_verify|password_reset`), usedAt.
  - `Category`, `Transaction`, `RecurringRule`, `AppSettings`.
- Build auth APIs:
  - `POST /auth/register` (create inactive/unverified user + send verification code email).
  - `POST /auth/verify-email` (verify code; activate account).
  - `POST /auth/login` (email or userId + password; set HttpOnly JWT cookie).
  - `POST /auth/logout` (clear cookie/token state).
  - `GET /auth/me` (current user profile).
  - `POST /auth/forgot-password`, `POST /auth/verify-reset-code`, `POST /auth/reset-password`.
- Security policies:
  - Hash passwords (`bcrypt`/`argon2`), hash verification codes at rest.
  - Reset code policy: 6 digits, 10 min expiry, max 5 attempts.
  - Login/session via HttpOnly Secure SameSite cookies.
  - Basic rate limit on auth endpoints.
- Build finance APIs:
  - Categories CRUD (user-scoped).
  - Transactions CRUD with filters.
  - Recurring rules CRUD + optional manual reconcile endpoint.
  - Dashboard monthly aggregates endpoint.
- Recurring engine:
  - Implement `reconcileRecurring(now, userId)` as on-demand catch-up on read endpoints.
  - Idempotency key per generated period to avoid duplicates.
  - Update `nextRunAt` deterministically.

3. **Frontend (`client`)**
- Setup React router and responsive app shell (mobile-first, bottom nav, quick-add CTA).
- Brand app as **Penny Pulse** (title, manifest, visible branding).
- Auth screens:
  - Register (first name, last name, user ID, email, mobile optional, password).
  - Email verification screen (signup code).
  - Login (identifier = email or user ID).
  - Forgot password (request code, verify code, reset password).
- Protected app screens:
  - Dashboard (month totals + category summary).
  - Transactions list + add/edit form.
  - Recurring rules list + add/edit form.
  - Categories management (starts empty).
  - Settings (currency default INR, timezone display/config).
- API layer:
  - Centralized client with cookie-based auth.
  - Error/empty/loading states and cold-start tolerant retry UX.
- PWA support:
  - Manifest + installability + cached shell behavior.
  - Offline message for API-dependent views.

4. **Config and environment**
- `server/.env.example`:
  - `MONGODB_URI` using your template with placeholders
  - JWT secret(s), Resend API key, sender email, CORS origins, app URL, timezone
- Use your provided DB template safely:
  - `mongodb+srv://pennypulseadmin:${DB_PASSWORD}@mypersonaldb.ixz20bg.mongodb.net/pennypulse?...`
- `client/.env.example`:
  - `VITE_API_BASE_URL`

5. **Deployment**
- **Vercel**: deploy `client`, set `VITE_API_BASE_URL` to Render URL.
- **Render**: deploy `server`, set required env vars including Atlas URI and email provider secrets.
- **Atlas**: configure DB user/network access for MVP.
- **Uptime**: external 10-min monitor (UptimeRobot) pinging `GET /health`.

### Test Plan
1. **Backend unit/integration**
- Auth validation, password hashing, cookie issuance/clearing.
- Signup verification and reset-code policies (expiry, attempts, invalid/used codes).
- Recurrence date calculations across daily/weekly/monthly/yearly.
- Reconciliation idempotency and backfill correctness.
- Dashboard aggregation correctness.

2. **Frontend**
- Form validations and auth flow transitions.
- Protected route behavior when logged out/logged in.
- Finance CRUD screen behavior and reconciliation-triggered updates.
- Mobile viewport smoke tests and installability checks.

3. **End-to-end smoke**
- Register → verify email → login → create category → create recurring expense → view generated transactions.
- Forgot password full flow succeeds and old session invalidates.
- Deployed app (Vercel + Render + Atlas) works with CORS and cold-start resilience.

### Assumptions and Defaults
- Single-user product scope per account (no shared households in v1).
- INR is default/only currency in v1.
- Email provider: Resend.
- Free-tier cold starts are acceptable; recurrence remains on-demand (not always-on cron).
- Repo structure fixed as `client/` + `server/` with root orchestration scripts.
