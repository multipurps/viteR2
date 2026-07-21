-- Run once in Supabase SQL editor.
-- Foundation for the Story DNA recommendation engine.

-- ── Interactions ────────────────────────────────────────────────────
-- Every rating/signal a user gives a title. One row per (user, title).
-- watched_pct comes from the existing zeeyus_continue tracking — this
-- table doesn't duplicate playback position, just the interpreted
-- signal (rating, and how far they got if unrated).
create table if not exists zeeyus_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  rating text check (rating in ('love', 'like', 'dislike', 'not_interested')),
  watched_pct integer check (watched_pct between 0 and 100),
  reasons text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

alter table zeeyus_interactions enable row level security;

drop policy if exists "Users manage their own interactions" on zeeyus_interactions;
create policy "Users manage their own interactions"
on zeeyus_interactions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- ── Story DNA cache ─────────────────────────────────────────────────
-- Shared across every user — a title's DNA doesn't change, so this is
-- generated once (via the story-dna Edge Function) and read forever
-- after. Public read (needed for the recommend function to score
-- candidates); writes only via service role (the Edge Function).
create table if not exists zeeyus_story_dna (
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  dna jsonb not null,
  generated_at timestamptz not null default now(),
  primary key (tmdb_id, media_type)
);

alter table zeeyus_story_dna enable row level security;

drop policy if exists "Story DNA is publicly readable" on zeeyus_story_dna;
create policy "Story DNA is publicly readable"
on zeeyus_story_dna for select
using (true);
-- No insert/update/delete policy for authenticated/anon — only the
-- service role (Edge Functions) can write, which bypasses RLS.

-- ── Taste profile ───────────────────────────────────────────────────
-- One row per user — recomputed (not appended) whenever their ratings
-- change meaningfully. A cache, not a log.
create table if not exists zeeyus_taste_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now()
);

alter table zeeyus_taste_profile enable row level security;

drop policy if exists "Users read their own taste profile" on zeeyus_taste_profile;
create policy "Users read their own taste profile"
on zeeyus_taste_profile for select
to authenticated
using (auth.uid() = user_id);
-- Writes only via service role (recompute happens inside the
-- recommend/story-dna Edge Functions, not from the client).
