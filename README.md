# Zeeyus — v2 rebuild (branch: v2-rebuild)

Personal media browser/tracker. `main` is untouched and still live — this branch
is where the Vite + React rebuild is happening.

## What's built so far
- Vite + React scaffold, routing via `react-router-dom`
- Side nav (Home / Movies / TV Shows / Top 10s / Watchlist / Profile / AI Picks)
- Auto-rotating full hero on Home, backed by TMDB `trending`
- Genre rows on Home
- TV show detail page: poster/backdrop as ambient background, season picker,
  episode cards with rating + synopsis
- Movie detail page
- Top 10s page: per-platform tabs (Netflix, Prime, Hulu, Apple TV+, HBO Max,
  Disney+) using TMDB `discover` filtered by `with_watch_providers`, sorted by
  popularity. **This is explicitly labeled in the UI as TMDB-popularity-based,
  not each platform's official internal chart** — no public API exposes that
  data anywhere, and this project intentionally does not scrape FlixPatrol or
  similar for it.
- Legacy v1 (`index.html`, `admin.html`) preserved under `legacy-v1/` for
  reference while auth/continue-watching get ported over.

## Not built yet
- Movies / TV Shows browse pages (currently stubs)
- Watchlist, Profile, AI Picks (currently stubs)
- Google sign-in + owner-approval gate (Supabase client is wired in
  `src/lib/supabase.js`; the old `admin.html` already has a login/PIN flow to
  port over)
- Continue-watching sync via Supabase (currently reads a local placeholder)

## Setup
Copy `.env.example` to `.env.local` and fill in your TMDB key + Supabase
project URL/anon key. `.env.local` is gitignored.

```
npm install
npm run dev
```
