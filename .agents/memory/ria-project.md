---
name: Ria project structure
description: Top-level layout and runtime facts for the Ria PWA project.
---

All source lives under `VapidPerfumedAstrophysics/`.
- Frontend: React + Vite, port 5000 (webview workflow "Start application")
- Backend: Node/Express, port 3001 (console workflow "Backend API")
- Database: PostgreSQL via Supabase
- Workflows run `cd VapidPerfumedAstrophysics/frontend && npm install && npm run dev` and `cd VapidPerfumedAstrophysics/backend && npm install && node src/server.js`
- Node.js 24 module required (installed via installProgrammingLanguage)

**Why:** The workspace root is not the project root; cd into subdirs in workflow commands.

**How to apply:** Always prefix workflow shell commands with `cd VapidPerfumedAstrophysics/<sub>`.
