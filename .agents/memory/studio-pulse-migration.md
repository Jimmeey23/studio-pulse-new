---
name: Studio Pulse migration
description: Notes from migrating Studio Pulse (Physique57 India fitness analytics) from Lovable.dev into the Replit pnpm workspace.
---

# Studio Pulse migration

## Key facts
- Frontend: `artifacts/studio-pulse/` — React+Vite, Tailwind v3 (postcss), react-router-dom (NOT wouter)
- API: `artifacts/api-server/` on port 8080; Vite proxies `/api/*` to it
- Supabase: gracefully null when VITE_SUPABASE_URL absent; only used for realtime presenter mode + summary persistence

## Vite config
- Do NOT use `@tailwindcss/vite` plugin — app uses Tailwind v3 via postcss
- Do NOT add `css: { postcss: { plugins: [] } }` — this silently disables Tailwind
- `server.fs.strict: false` required (assets outside root)
- Proxy: `"/api": { target: "http://localhost:8080" }` in server config

## API routes wired
`/api/notes`, `/api/payroll`, `/api/openai`, `/api/gemini`, `/api/deepseek`, `/api/google/token`

## Required env vars (data won't load without these)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` — for Google Sheets OAuth
- Optional: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`

**Why:** Google Sheets is the primary data source; credentials are server-side only (never in browser bundle).

## React Query retry fix
The loading overlay (`anyLoading` in StudioPulse.tsx line 4537) stays visible until all 9 data hooks resolve. Without credentials, React Query retried each hook 3× with exponential backoff (~7s each), keeping the overlay up for 20+ seconds.

**Fix:** In `queryClient.ts`, set `retry` to a function that returns `false` for any `error.status >= 400`. In `googleAuth.ts`, attach `err.status = response.status` to thrown errors so the retry function can read it.

**Why:** 5xx from our API means credentials are missing (permanent), not a transient network failure — retrying wastes time.

## Deps that needed manual install
`@supabase/supabase-js`, `@intercom/messenger-js-sdk`, `@tanstack/react-table`, `react-window`, `zustand`, `xlsx`, `p-limit`, `p-retry`, `jspdf`, `jspdf-autotable`, `html2canvas`, `react-quill`
