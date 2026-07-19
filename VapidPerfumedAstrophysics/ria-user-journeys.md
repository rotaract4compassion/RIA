# Ria — Screen-by-Screen User Journeys & UI/UX Spec

Companion document to `ria-build-prompt.md`. Paste this in alongside the main build prompt so the agent has the full flow, not just the feature list.

---

# PART A — FIELD USER APP (mobile, `/`)

## A1. Pre-auth

**Screen: Splash**
- Dual-identity crossfade (Rotaract lockup ↔ Rotary lockup) while identity is unknown
- No interactive elements — pure branding beat, sub-1.5s total before auto-advancing
- Wheel spinner NOT shown here (this is branding, not a loading state)

**Screen: Welcome / Landing**
- One-screen pitch: what Ria is, in one line, plus "Register" and "Log In" as the only two actions
- Language toggle (EN/SW) visible here already, top corner — first thing a user should be able to control

**Screen: Register**
- Fields: name, club, email, phone number, password
- Inline validation (not a post-submit error dump) — phone number format check, password strength meter, email format
- No project selection yet — that happens after account creation, on first dashboard visit

**Screen: Log In**
- Fields: email OR phone number (single input, auto-detect which), password
- "Forgot password" link
- Errors are specific ("that phone number isn't registered" vs generic "invalid credentials") without leaking whether an email exists (standard security balance — phrase carefully)

**Screen: Add to Home Screen instructions**
- Shown once, right after first successful login/register, before the dashboard
- Platform-aware: detect iOS Safari vs Android Chrome and show the correct instruction path (iOS: Share → Add to Home Screen; Android: native install prompt, with this screen as a fallback if the browser doesn't auto-prompt)
- Skippable, but skipping doesn't dismiss it forever — a small persistent banner/reminder stays until the app is actually installed (detect via `display-mode: standalone`)

**Screens: First-run tutorial (3–5 screens, skippable, swipeable)**
1. "Find your project" — shows the affiliated-projects list + the "+" add-affiliation button
2. "Fill it out, even offline" — shows the questionnaire flow, emphasizes offline capability
3. "Your data, protected" — explains the submit → 30-minute local visibility window in plain language ("after you submit, it stays private on your phone and disappears from view — but don't worry, it still syncs")
4. "Track your impact" — shows the gamification dashboard preview
5. "Got something to say?" — shows the suggestion box
- Progress dots at the bottom, "Skip" always visible top-right

## A2. Home Dashboard (the screen users land on every relaunch)

- **Header:** greeting + resolved identity badge (small Rotaract/Rotary mark) + club name
- **Affiliated projects section:** cards for each project the user is currently part of, shown by default, each card shows project name, a short status line (e.g. "3 submissions this month"), tap to open
- **"+" affordance:** floating or inline button → opens **Browse/Search Projects** screen (search bar + list of admin-configured projects, tap to self-affiliate, confirmation toast)
- **Impact summary strip:** minutes of impact, regions worked, small achievement badges row — tap to expand into full **Achievements** screen
- **Bottom nav:** Home / Projects / Suggestions / Help / Profile (5 max, icon + label, current identity's palette applied throughout)

## A3. Project detail screen

- Project name, description, admin-set instructions if any
- "Start New Submission" primary button
- Small history: count of past submissions to this project (not the data itself, just a count — respects the 30-minute rule, nothing recorded is browsable after the fact)
- Sync status indicator for this project specifically (e.g. "2 pending sync")

## A4. Questionnaire flow (the core interaction)

- **Multi-step, one logical group of questions per screen** — not one giant scroll. Progress bar or step indicator at top.
- Skip logic evaluated live: conditional questions appear/disappear as prior answers change, no jarring reflow
- Numeric and text inputs only (v1) — appropriately typed keyboards (numeric keypad for number fields)
- **Location capture step:** explicit screen, shows a map pin or coordinate readout plus the GPS accuracy indicator; if permission denied, clear fallback messaging, does not block submission unless the questionnaire marks location as required
- **No review/summary screen before submit** — per the original spec, submission is direct from the last question to submit, no "here's what you entered" recap
- **Submit action:** shows the rotary-wheel loading spinner briefly (local save, and sync attempt if online), then:
- **Confirmation screen:** simple "Submitted ✓" state, no display of recorded answers, auto-returns to project detail after a couple seconds or on tap
- Local copy governed by the 30-minute visibility rule from the build prompt (§5) — after 30 minutes it silently disappears from any local view regardless of sync status

## A5. Achievements screen

- Grid of unlockable badges (visited-regions milestones, submission-count milestones, tenure milestones)
- Locked badges shown greyed with a hint of what unlocks them (avoid pure mystery — gamification works best when the next goal is visible)
- Regions map or list showing where the user has contributed

## A6. Suggestions screen

- Simple text box, character limit, anonymous/attributed toggle clearly visible above the input (not buried in settings)
- "Sent" confirmation, no thread/reply view needed in v1 (admins receive, users don't get a conversation back — keep it one-directional and cheap, per spec)

## A7. Help screen

- Persistent FAQ/how-to, reachable from bottom nav at any time
- Same content as the first-run tutorial, but browsable/searchable rather than swipe-only
- Contact/escalation path if something's broken (e.g. mailto or a simple "report a problem" text box)

## A8. Profile / Settings screen

- Name, club, contact info (editable)
- Language toggle (EN/SW) — also reachable here, not just pre-auth
- Logout
- Installed-state indicator ("Ria is installed" vs a nudge to install if somehow still browser-tab-only)
- App version / last sync time (small, unobtrusive — useful for support/debugging, not a headline feature)

## A9. System states to design explicitly (not afterthoughts)

- **Offline banner:** persistent but unobtrusive strip when `navigator.onLine` is false, doesn't block interaction
- **Sync-in-progress:** wheel spinner, small and inline, not a full-screen blocker
- **Sync failed / retry:** distinct from offline — data saved locally but a sync attempt failed (e.g. server error); don't alarm the user, just keep retrying quietly and reflect pending count
- **Empty states:** no affiliated projects yet, no achievements yet, no suggestions sent yet — each needs a friendly one-liner + the relevant call-to-action, not a blank screen

---

# PART B — ADMIN DASHBOARD (`/admin`)

## B1. Admin Login

- Separate auth flow/role from field users (not just a checkbox on the same login screen)
- Email + password (phone-number login not required for admin role)

## B2. Admin Home / Overview

- KPI row: total active projects, total submissions this week/month, total registered users, pending suggestions count
- **System health widget** front and center here (not buried) — DB size vs free-tier cap, hosting status
- Quick links into Projects, Users, Admins, Suggestions

## B3. Projects list

- Table/card list of all projects, status (active/archived), submission count, last activity
- "New Project" action

## B4. Project creation / edit

- Basic info: name, description, club/org association (drives which theme palette applies if org-scoped)
- **Questionnaire builder** (the most complex admin screen):
  - Add/reorder/remove questions, each typed (text or numeric)
  - Conditional logic editor: "show this question if [prior question] = [value]" — a simple visual rule builder, not raw JSON editing
  - Mark fields required/optional, mark location required/optional
  - **Versioning notice:** if editing a questionnaire that already has submissions, show a clear warning: "This project already has N submissions. Saving will create a new version — existing submissions keep their original questions." No silent mutation.

## B5. Project detail (admin view)

- Tabs or sections: **Submissions**, **Analytics**, **Impact Report**, **Settings**
- **Submissions tab:** raw data table, filterable by date/region/user, duplicate-flag indicator on suspect rows, export buttons (CSV/JSON)
- **Analytics tab:** submission volume over time (chart), region-based activity **heatmap**, breakdown by questionnaire version if multiple exist
- **Impact Report tab:** generate the auto-built PDF/export summarizing minutes of impact, regions covered, participant counts — preview before download
- **Settings tab:** archive project, edit questionnaire (routes to B4)

## B6. Admin management

- List of current admins, scope shown per admin (project-scoped vs global)
- "Create Admin" action — new admin defaults to scoped-to-this-project; promoting to global privilege is a separate, explicit toggle
- **Audit log view:** who created whom, when — simple chronological list, not a full permissions matrix

## B7. User management

- List of registered field users, searchable, shows club/affiliation
- Flag/mark unclear registrations, revoke access action (with confirmation step — this is destructive)

## B8. Suggestions inbox

- List of incoming suggestions, respecting the anonymous/attributed toggle each was sent with (attributed ones show the sender, anonymous ones don't — enforced server-side, not just hidden in UI)
- Read/unread state
- Auto-expiry countdown or expiry date visible per suggestion so admins know what's about to disappear

## B9. Admin UI/UX principles

- Dense, table-first — admins are triaging data, not browsing a mobile feed. Sidebar nav, not bottom nav.
- Same identity-driven palette applies (an admin's own org identity sets their dashboard accents), but overall admin chrome stays neutral/professional (more white/grey, palette as accent only) so dense data tables stay legible
- Every destructive action (revoke access, archive project, promote admin to global) requires a confirmation step

---

**Use this alongside `ria-build-prompt.md` and the asset manifest — this document defines the screens and flow; the build prompt defines the stack and feature requirements; the assets define the visual marks.**
