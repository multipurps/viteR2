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
- Movies / TV Shows browse pages ✅ done
- Watchlist ✅ done (reads/writes `zeeyus_watchlist`, same table your old
  admin panel already pointed at — it just wasn't wired up on the front end)
- Continue-watching ✅ done, reads `zeeyus_continue` for the signed-in user
- Google sign-in + owner-approval gate ✅ done — new sign-ins get a
  `zeeyus_profiles` row with `approved:false`; approve/block from `/admin`
  exactly like before
- Profile page ✅ done, now with a real uploaded picture instead of just
  initials
- AI Picks — still a stub

## QR desktop login — setup needed
This needs two things only you can do (I can't reach Supabase's API or
deploy Edge Functions from my sandbox):

1. Run `supabase/sql/001_pairing.sql` once in the Supabase SQL editor
   (creates the `zeeyus_pairing` table + RLS policies).
2. Deploy the Edge Function:
   ```
   supabase functions deploy approve-pairing
   ```
   (run from the repo root with the Supabase CLI logged in and linked
   to your project — it needs `SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`, which Supabase sets automatically for
   Edge Functions, no manual secret config needed)

How it works: desktop generates a random code + QR (encoding
`/pair/<code>`), inserts a pending row, and subscribes to it via
Realtime. Your phone — already signed in — scans it, hits `/pair/<code>`
(gated behind the same approval check as everything else), and taps
Confirm. That calls the Edge Function with the phone's own session
token, which verifies the account is approved, mints a single-use
magic-link OTP, and writes it to the pairing row. Desktop picks that up
and redeems it via `supabase.auth.verifyOtp`. No password ever crosses
the wire, and the OTP is single-use.

## One-time Supabase setup needed (I can't do this with just the anon key)
Run this once in the Supabase SQL editor, for the profile-picture column:
```sql
alter table zeeyus_profiles add column if not exists avatar_url text;
```
Then in Supabase Storage, create a **public** bucket named `avatars`
(Storage → New bucket → name `avatars` → toggle Public on). That's what
profile picture uploads write to.

Google OAuth itself should already work since your old `admin.html` had it
configured — same Supabase project, same provider setup.

## Setup
Copy `.env.example` to `.env.local` and fill in your TMDB key + Supabase
project URL/anon key. `.env.local` is gitignored.

```
npm install
npm run dev
```
