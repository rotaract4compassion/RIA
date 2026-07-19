# Ria — Full Build Prompt

Paste this into Replit Agent (or any AI coding agent). It is written to be exported and finished manually in Cursor/VS Code, then deployed off-Replit.

---

## 1. What we're building

**Ria** ("Rotary/Rotaract in Action") is a full-stack, mobile-first Progressive Web App for collecting field data on Rotary/Rotaract community action projects across Africa. It is a philanthropic tool, not a commercial product — architecture must favor low/zero ongoing hosting cost over raw scale.

Two experiences in one codebase, split by role and route, NOT by separate apps:
- **Field User App** (`/`) — the PWA Rotaractors install on their phones to submit project data, even offline.
- **Admin Dashboard** (`/admin`) — where project admins configure projects, questionnaires, manage other admins, and review/export data.

---

## 2. Tech stack (fixed — do not substitute)

- **Frontend:** React + Vite, PWA via `vite-plugin-pwa` (manifest + service worker, installable on iOS Safari and Android Chrome)
- **Backend:** Node.js + Express, REST API
- **Database:** PostgreSQL (Supabase-compatible connection string)
- **Local/offline storage:** IndexedDB (via `idb` library) on the client
- **Auth:** Email + phone number + password, JWT-based sessions with refresh tokens stored so the PWA stays logged in after "Add to Home Screen" (see §7)
- **Styling:** Tailwind CSS, mobile-first, no heavy component library — custom, minimalist components

## 3. Deployment target — build for export, not Replit hosting

Do not wire this to Replit's own deploy/hosting product. Structure the project as three independently deployable pieces so it can be pushed to free-tier hosts after leaving Replit:

- `/frontend` — static build output deployable to **Vercel** (or Netlify)
- `/backend` — Express app deployable to **Render** (free web service tier) — read `PORT` from `process.env.PORT`, no Replit-specific env assumptions
- Database — connect via standard `DATABASE_URL` env var, compatible with **Supabase** Postgres

Include a top-level `DEPLOYMENT.md` explaining exactly how to point each piece at Vercel / Render / Supabase, with placeholder env vars clearly marked.

**Note on free-tier hosting branding:** Vercel, Render, and Supabase free tiers may inject their own watermark/badge (e.g. a small "Powered by X" mark) or show a visible cold-start delay after idle periods — this is a hosting-platform artifact, separate from and in addition to the in-app partner/sponsor credit strip. Check each platform's current free-tier terms before launch; removing platform badges may require a paid tier on that specific service.

## 4. Brand & design language

Minimalist but warm — comfortable, not clinical. Generous whitespace, soft rounded corners, no harsh drop shadows.

- **Identity-driven dynamic theme** — the app does not just support a color preset per organization, it detects/resolves the user's identity (Rotaractor vs Rotarian) during onboarding and switches the entire UI palette accordingly once resolved:
  - **Rotary palette** (Rotarian users): navy blue, gold, white, black
  - **Rotaract palette** (Rotaractor users): hot pink, white, gold accent, black
  - Store as a theme config object (CSS variables) driven by the resolved user identity, not just an org-level flag, so switching is a single state change, not a rebuild
- **Splash screen — dual identity, resolves after onboarding:**
  - **Pre-onboarding** (identity not yet known): crossfade/flash between the "Rotaract in Action" lockup and the "Rotary in Action" lockup so neither identity is assumed
  - **Post-onboarding** (identity resolved): show only the matching lockup (Rotaract or Rotary), animated in (fade + scale, sub-1s)
  - Below the resolved lockup, a understated "In partnership with" strip shows four partner marks in this order: **Rotary International, Rotaract Tanzania, Rotaract Muhimbili, Nama Labs**
  - The Rotary gear/wheel is NOT part of this partner strip — see below
- **Primary app icon (home screen / PWA manifest):** the gold gradient hands-and-wheel mark on its solid background is the intentional, canonical Ria app icon — this is correct as delivered, keep the background (app icons are expected to be opaque squares/circles, unlike inline UI marks)
- **Rotary gear/wheel motif — repurposed as the app's loading spinner**, not used as a static partner mark anywhere. Use it as a rotating loading asset (e.g. CSS `animation: spin` on the wheel SVG) shown during sync-in-progress, questionnaire submission, and any other async wait state across the app
- Subtle SVG-based micro-animations on key transitions (questionnaire submit success, achievement unlock) — keep these lightweight, no heavy animation libraries that bloat bundle size
- Bottom-nav mobile app feel for the field user view; clean sidebar/table-dense feel for admin

## 5. Field User App — full flow

### Onboarding & auth
- Register: name, club, email, phone number, password
- Login: email OR phone number + password
- **Persistent session:** once installed to home screen, the user should NOT need to log in again on relaunch — store refresh token securely (httpOnly-equivalent pattern adapted for PWA, or secure IndexedDB token storage with silent refresh)
- **Deep-link resume:** if the app is backgrounded or closed mid-questionnaire, relaunching from the home screen icon should return the user to exactly where they left off (persist in-progress form state locally), not force them back to the home dashboard
- Explicit in-app "Add to Home Screen" onboarding screen with visual instructions (iOS Safari does not prompt automatically — this step is mandatory, not optional polish)
- **First-run interactive tutorial:** a short, skippable walkthrough after first registration covering how to find/join a project, fill and submit a questionnaire offline, and where to find the suggestion box — 3-5 screens max, not a wall of text
- Persistent "Help" entry point (not just first-run) — a simple FAQ/how-to screen reachable from the dashboard at any time, since field volunteers won't remember a tutorial they saw once at signup

### Home dashboard
- Shows projects the user is currently affiliated with, shown by default
- "+" affordance to search/browse other admin-configured projects and self-affiliate
- Gamified impact summary: minutes of impact contributed, number of locations/regions worked in, club name, unlockable achievements

### Data collection
- Each project has an admin-configured questionnaire (dynamic form schema, JSON-driven — text and numeric fields only in this iteration, no images yet)
- Support conditional/skip logic (e.g. "only show question 5 if question 3 = yes") in the schema — model this similarly to XLSForm/ODK-style form definitions rather than a flat field list
- **Questionnaire versioning:** when an admin edits a project's questionnaire after submissions already exist, create a new schema version rather than mutating the old one. Every submission stores which schema version it was collected under, so analytics and exports never misattribute answers to the wrong question set
- Auto-capture location per submission where permitted, plus a visible GPS accuracy indicator at capture time
- Flag likely duplicate submissions server-side (same user, same project, near-identical timestamp and location) for admin review — don't auto-reject, just surface
- Fully offline-capable: form drafts and completed-but-unsynced submissions live in IndexedDB
- Background sync: when connectivity returns, queued submissions sync automatically to the backend API
- **On submit:** show a simple confirmation ("Submitted") without redisplaying the recorded answers
- **30-minute local visibility window:** once submitted, the local copy must become invisible to the user 30 minutes after submission — whether or not it has synced yet. If it has synced, delete it locally. If it hasn't synced yet, keep it in local storage (so sync can still happen later) but hide it from any UI the user can see.

### Suggestions
- Lightweight text-only suggestion box to admins, with an anonymous/attributed toggle
- Suggestions auto-expire and are deleted server-side after a configurable retention window (keep this cheap — no attachments, no rich media)

## 6. Admin Dashboard — full flow

- Secured login (separate role, not just a flag on the same user table — proper role-based access)
- Create/edit projects
- Build dynamic questionnaires via a form builder UI, stored as JSON schema per project
- **Admin management:** any existing admin can create another admin account. Scope newly created admins to the project they were created under by default (global privilege should be an explicit extra step, not the default), and log who created whom with a timestamp — a lightweight audit trail, not a full permissions system
- User management: view registered users, flag/mark unclear or suspicious registrations, revoke access
- Submission data view: raw text/numeric data per project, with:
  - Export to CSV and JSON at minimum
  - Basic quick analytics (submission counts over time, by project, by region)
  - A region-based activity heatmap, not just tabular counts — this is the visual that makes impact legible at a glance
- **Auto-generated impact report:** a clean, brandable PDF/export summarizing a project's real submitted data (minutes of impact, regions covered, participant counts) — the kind of document a club can hand to a district governor or funder without manual assembly
- View incoming suggestions (respecting anonymity toggle)
- **System health widget:** surfaces current DB size vs free-tier cap and other hosting limits, so whoever holds the purse sees a warning before a free-tier pause or overage happens, not after

## 7. Offline & sync architecture (be explicit about this)

- Use a service worker (Workbox via `vite-plugin-pwa`) for asset caching and installability
- Use IndexedDB (not localStorage) for form drafts, submission queue, and session tokens
- Sync engine: on regaining connectivity (`navigator.onLine` + periodic retry), flush the local submission queue to `POST /api/submissions`, mark synced, apply the 30-minute visibility rule described in §5
- Keep payloads small — text/numeric fields and coordinates only; no images or files in this iteration

## 8. Non-functional requirements

- Optimize for near-zero idle cost: no background polling loops, no unnecessary always-on processes on the backend
- Keep dependencies lean — avoid heavy UI/animation libraries that bloat the PWA install size
- Document every third-party service used and its free-tier limit in `DEPLOYMENT.md`, so whoever maintains this later knows exactly when a paid tier becomes necessary
- **Bilingual Swahili/English toggle in v1** (not deferred) — all field-user-facing UI and questionnaire labels should support both languages
- Automated periodic export/backup of the database to a durable store (e.g. scheduled dump to cloud storage), so project data isn't hostage to any single host disappearing or a free-tier project pausing

---

**Build this as a working, exportable codebase I can pull into Cursor/VS Code to finish styling and deploy manually to Vercel (frontend), Render (backend), and Supabase (database).**

## 9. Delivered visual assets — use these exactly, do not regenerate

All final logo, icon, and splash assets already exist and are provided alongside this prompt. Place them in the frontend project as follows and reference them directly — do not design new marks.

- **`/public/icons/`** — Ria's own PWA icon set (primary app icon, home-screen/manifest icons). The gold gradient hands-and-wheel mark on its solid gold background is the canonical app icon (`ria-app-icon-whitebg-*` files) — this background is intentional, keep it. Also includes `ria-app-icon-maskable-512.png` (padded, for Android adaptive icons) and `ria-app-icon-symbol.svg` (vector source).
- **`/public/partners/`** — full icon sets + wordmarks for the four "in partnership with" marks: Rotary International, Rotaract Tanzania, Rotaract Muhimbili, Nama Labs. Used only in the post-onboarding splash partner strip and an admin/about "credits" screen — never as app icons.
- **`/public/splash/`** — `ria-rotaract-splash-lockup.png` and `ria-rotary-splash-lockup.png` (the two dual-identity splash lockups), `splash-screens.html` (reference implementation of the pre/post-onboarding splash states — port this logic into the React app, don't ship the raw HTML file), and `splash-animation.css` (base fade/scale-in keyframes).
- **`/src/assets/loading/rotary-wheel-spinner.svg`** — the Rotary gear/wheel motif, repurposed as the app-wide loading spinner. Wire this into a reusable `<LoadingSpinner />` component with a CSS `rotate` animation; use it for sync-in-progress, submission-in-flight, and any other async wait state. Do not place this wheel mark in the partner strip.

## 10. Screen-by-screen flow

See the companion document `ria-user-journeys.md` for the full screen-by-screen breakdown of both the Field User App and Admin Dashboard, including every screen's purpose, key elements, and system states (offline, syncing, empty states). Build to that flow exactly — it is the source of truth for navigation structure and screen count, not a rough guide.
