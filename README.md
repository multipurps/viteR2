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

## Real Netflix Top 10 — one more Edge Function to deploy
Netflix is the only platform with a genuine official Top 10 (everyone else
— Disney+, Prime, HBO Max, Apple TV+, Hulu — has no public official chart,
period). Wired up via a proxy since a browser can't fetch netflix.com
directly (CORS):
```
supabase functions deploy netflix-top10
```
Without this deployed, the Netflix row silently falls back to the same
TMDB-popularity estimate as the other platforms — labeled honestly either
way (badge says "Real weekly ranking" vs "Estimated · TMDB popularity").
Heads up: this one parses Netflix's public HTML page (they don't offer a
real API), so it's more fragile than the TMDB integration — if it stops
returning results, Netflix likely changed their page markup and the
regex in `supabase/functions/netflix-top10/index.ts` needs updating.

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

## Recommendation engine (Story DNA) setup

Three things need to happen once, outside of what a git push can do:

1. Run `supabase/sql/003_recommendations.sql` in the Supabase SQL editor
   (creates `zeeyus_interactions`, `zeeyus_story_dna`, `zeeyus_taste_profile`).

2. Set these as Edge Function secrets (Supabase dashboard → Edge Functions →
   Secrets, or via CLI):
   ```
   supabase secrets set GROQ_API_KEY=your_groq_key
   supabase secrets set TMDB_API_KEY=your_tmdb_v3_key
   ```
   (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are provided automatically —
   no need to set those.)

3. Deploy the two new functions:
   ```
   supabase functions deploy story-dna
   supabase functions deploy recommend
   ```

Until all three are done, `/ai` will just show the "rate a few titles" empty
state — the client code fails gracefully rather than erroring.

How it works, briefly: rating a title (Love/Like/Dislike/Not for me) writes to
`zeeyus_interactions`. `recommend` builds a taste profile from whatever's been
rated (weighted — Love counts far more than a completed-but-unrated watch),
scores a fresh candidate pool against it with zero AI calls, and only spends
one Groq call per request on the final top-4 picks + explanations. Story DNA
per title is generated once and cached forever in `zeeyus_story_dna` — that's
the actual cost control, not the request-time logic.

## Web push notifications setup

Two things this powers: Coming Soon reminders firing on release day, and
the AI proactively announcing a new recommendation ("AI announcement").
Both are push notifications, both need the same setup:

1. Run `supabase/sql/006_push.sql` in the SQL editor (push subscriptions
   table + a couple of tracking columns).

2. Set these as Edge Function secrets, in addition to the ones from the
   recommendation engine setup:
   ```
   supabase secrets set VAPID_SUBJECT=mailto:your@email.com
   supabase secrets set VAPID_PUBLIC_KEY=your_vapid_public_key
   supabase secrets set VAPID_PRIVATE_KEY=your_vapid_private_key
   ```
   (The public key is also hardcoded in `src/lib/push.js` — that's normal,
   VAPID public keys are meant to be public. Only the private key is a
   real secret.)

3. Deploy:
   ```
   supabase functions deploy recommend
   supabase functions deploy send-reminders
   supabase functions deploy notify-recommendations
   ```
   (`recommend` changed too — its logic moved into a shared module so
   `notify-recommendations` can reuse it, so it needs redeploying even
   though its behavior from the client's point of view hasn't changed.)

4. Both `send-reminders` and `notify-recommendations` are meant to run on
   a schedule, not be called from the app. Supabase doesn't cron Edge
   Functions by itself — you need `pg_cron` + `pg_net` enabled
   (Database → Extensions in the dashboard, enable both), then run this
   in the SQL editor, filling in your own project ref and a **service
   role key** (Settings → API — keep this one out of chat/version
   control, it's not like the anon key):

   ```sql
   select cron.schedule(
     'send-reminders-daily',
     '0 14 * * *', -- once a day, 14:00 UTC — adjust to taste
     $$
     select net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
       headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY', 'Content-Type', 'application/json'),
       body := '{}'::jsonb
     );
     $$
   );

   select cron.schedule(
     'notify-recommendations-weekly',
     '0 16 * * 3', -- once a week, Wednesday 16:00 UTC — adjust to taste
     $$
     select net.http_post(
       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-recommendations',
       headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY', 'Content-Type', 'application/json'),
       body := '{}'::jsonb
     );
     $$
   );
   ```

   `notify-recommendations` runs the full pipeline (deterministic scoring
   + one Groq call) once per eligible user per run — it's the one cost
   that scales with your user count rather than just request count, which
   is why it defaults to weekly rather than daily. `send-reminders` is
   cheap (no AI calls at all) so daily is fine.

How the "AI announcement" actually decides when to notify: it only
fires if the headline pick (Your Next Obsession, or the next category
down if that's empty) is a *different* title than what it last
announced to that user — rating more titles or new releases entering
the catalog are what change the pick over time, not the schedule
itself. Cooldown is 6 days between announcements per user regardless.
