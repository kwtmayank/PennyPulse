## Penny Pulse Execution Checklist

### 1. Monorepo Foundation
- [x] Root scripts orchestrate client + server (`dev`, `build`, `test`, `lint`)
- [x] `client/` and `server/` structure in place
- [x] Root `.gitignore` added
- [x] `README.md` and env examples documented

### 2. Backend (Server)
- [x] Express app setup with JSON, CORS allowlist, cookies, error handling
- [x] MongoDB connection + required env validation
- [x] `/health` endpoint with uptime and timestamp
- [x] Mongoose models for User, EmailVerificationCode, Category, Transaction, RecurringRule, AppSettings
- [x] Auth APIs: register, verify-email, login, logout, me, forgot-password, verify-reset-code, reset-password
- [x] Security: hashed passwords/codes, rate limiting, HttpOnly cookie sessions, reset code policy
- [x] Finance APIs: categories, transactions, recurring rules, dashboard monthly
- [x] Recurring reconciliation with idempotency key + deterministic `nextRunAt`
- [x] Hardening pass: ownership checks for category-linked writes and patch-field allowlists

### 3. Frontend (Client)
- [x] Router + protected routes + mobile-first shell with bottom nav + quick-add CTA
- [x] Penny Pulse branding in app title and PWA manifest
- [x] Auth screens: register, verify email, login, forgot password
- [x] Reset password flow now includes explicit code verification step
- [x] Protected screens: dashboard, transactions, recurring rules, categories, settings
- [x] Central API client with cookie auth and offline-friendly network error messaging
- [x] PWA manifest + service worker shell caching

### 4. Config and Deployment Docs
- [x] `server/.env.example` includes Mongo/JWT/Resend/CORS/app vars
- [x] Atlas URI template with `${DB_PASSWORD}` placeholder
- [x] `client/.env.example` includes `VITE_API_BASE_URL`
- [x] README deployment guidance for Vercel + Render + Atlas + uptime monitoring

### 5. Testing
- [x] Server recurrence unit tests present and passing
- [ ] Add backend tests for auth code expiry/attempt behavior
- [ ] Add frontend interaction tests for auth + protected routes + CRUD smoke
- [x] Monorepo build passes

### Next Priority Work
1. Add backend integration tests for auth and finance route validation.
2. Add frontend tests (Vitest + React Testing Library) for auth and protected navigation.
3. Add CI workflow to run `npm test` and `npm run build` on pushes/PRs.
