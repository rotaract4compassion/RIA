# Ria — Rotary/Rotaract in Action

A full-stack, mobile-first Progressive Web App for collecting field data on Rotary/Rotaract community action projects across Africa.

## Project structure

```
/frontend     React + Vite PWA (field user app + admin dashboard)
/backend      Node.js + Express REST API
DEPLOYMENT.md Full deployment guide (Vercel + Render + Supabase)
```

## Two experiences in one codebase

- **`/`** — Field User PWA: Rotaractors install on their phones to submit project data, even offline
- **`/admin`** — Admin Dashboard: project admins configure projects, questionnaires, manage users, review/export data

## Tech stack

- **Frontend:** React + Vite, PWA via `vite-plugin-pwa`, Tailwind CSS
- **Backend:** Node.js + Express, REST API
- **Database:** PostgreSQL (Supabase-compatible)
- **Offline:** IndexedDB via `idb`, Workbox service worker
- **Auth:** JWT access + refresh tokens, identity-driven UI theming
- **i18n:** Bilingual EN/SW toggle

## Running locally

```sh
# Backend
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, etc.
npm install
node src/db/migrate.js  # run once to set up schema
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Deployment

See `DEPLOYMENT.md` for step-by-step instructions for Vercel (frontend), Render (backend), and Supabase (database).

## User preferences

- Build for export/deployment outside Replit — no Replit-specific hosting
- Architecture must favor low/zero ongoing hosting cost
- All field-user UI must support EN/SW bilingual toggle
- Do not use heavy UI libraries — custom Tailwind components only
