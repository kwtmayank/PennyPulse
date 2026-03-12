# PennyPulse

PennyPulse is a mobile-friendly MERN finance tracker with recurring expense support, authentication, and email-based verification/reset flows.

## Monorepo layout

- `client/` React + TypeScript + Vite + PWA
- `server/` Node.js + Express + MongoDB (Mongoose)

## Features

- Register, login, logout, and authenticated sessions with HttpOnly cookies
- Email verification at signup
- Forgot password with 6-digit code (10 min expiry, max 5 attempts)
- Transactions CRUD
- Recurring rules (daily/weekly/monthly/yearly) with on-demand reconciliation
- Categories CRUD (starts empty)
- Monthly dashboard aggregates
- Settings (currency/timezone)
- Health endpoint for uptime monitoring: `GET /health`

## Local setup

1. Copy env examples:
   - `cp server/.env.example server/.env`
   - `cp client/.env.example client/.env`
2. Fill values in `server/.env` (Mongo URI, JWT secret, Resend settings).
3. Install dependencies:
   - `npm install`
   - `npm install --prefix server`
   - `npm install --prefix client`
4. Run both apps:
   - `npm run dev`

### Default local ports

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## Deployment

### Frontend (Vercel)

- Deploy `client/`
- Set `VITE_API_BASE_URL=https://<your-render-service>.onrender.com`

### Backend (Render)

- Deploy `server/`
- Set env vars from `server/.env.example`
- Ensure `ALLOWED_ORIGINS` includes your Vercel app domain

### Database (MongoDB Atlas)

Use your DB template securely via env var:

`mongodb+srv://pennypulseadmin:${DB_PASSWORD}@mypersonaldb.ixz20bg.mongodb.net/pennypulse?retryWrites=true&w=majority&appName=MyPersonalDB`

### Uptime monitoring

- Add UptimeRobot HTTP monitor on: `GET /health`
- Interval: every 10 minutes

## API overview

### Auth

- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/verify-reset-code`
- `POST /auth/reset-password`

### Finance

- `GET/POST/PATCH/DELETE /api/categories`
- `GET/POST/PATCH/DELETE /api/transactions`
- `GET/POST/PATCH/DELETE /api/recurring-rules`
- `POST /api/recurring-rules/:id/run-now`
- `POST /api/recurring/reconcile`
- `GET /api/dashboard/monthly?month=YYYY-MM`
- `GET/PATCH /api/settings`

