-- Run once in Supabase SQL editor.
-- Backs the "Remind Me" button on Coming Soon For You picks.

create table if not exists zeeyus_reminders (
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  release_date date,
  created_at timestamptz not null default now(),
  primary key (user_id, tmdb_id, media_type)
);

alter table zeeyus_reminders enable row level security;

drop policy if exists "Users manage their own reminders" on zeeyus_reminders;
create policy "Users manage their own reminders"
on zeeyus_reminders for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
