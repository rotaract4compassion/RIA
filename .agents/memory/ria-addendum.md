---
name: Ria addendum v2 scope
description: What the v2 addendum added and where each feature lives.
---

All 8 addendum sections from `attached_assets/Pasted--Ria-Addendum-Prompt-v2-additions-*.txt` are implemented.

**New backend routes:**
- `/api/leaderboard` — by-individual and by-club, three metrics, global + project scope
- `/api/broadcasts` — field user fetch, unread count, mark-read; admin CRUD under `/api/broadcasts/admin`
- `/api/projects/:id/mark-briefing-viewed` — track first-view of project briefing

**Schema additions (in schema.sql, also as ALTER TABLE IF NOT EXISTS for safe migration):**
- `broadcasts`, `broadcast_reads`, `user_briefing_views` tables
- `briefing_content` on projects
- `leaderboard_visible`, `profile_picture_url` on users
- `club`, `phone`, `title` on admins

**New frontend pages:**
- `ProjectBriefingScreen` — gated on first visit, tracks state in localStorage
- `LeaderboardScreen` — individual/club toggle, metric toggle, scope toggle
- `AnnouncementsScreen` — unread-first, mark-read on open, pull-to-refresh

**New admin pages:**
- `AdminBroadcasts` — compose form with audience picker, priority/expiry, image upload hook

**Fixed bugs:**
- SplashScreen: now checks `display-mode: standalone` before redirecting to `/add-to-home`
- QuestionnaireScreen success state: now shows "Submit Another" + "Back to Home" instead of single back button

**Supabase Storage:** client-side compression hooks are wired (compressImage helper), but actual upload requires SUPABASE_URL + SUPABASE_ANON_KEY env vars and a `ria-media` public bucket. The upload call is stubbed with a TODO comment in ProfileScreen and AdminBroadcasts.

**Seed script:** `scripts/seed-admin.js` — idempotent, reads from env vars, bcrypt hashes password.
