-- Run once in Supabase SQL editor.

-- Stores each browser/device's push subscription so send-reminders can
-- target them. A user can have more than one (multiple devices), so
-- this is its own table, not a column on zeeyus_profiles.
create table if not exists zeeyus_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table zeeyus_push_subscriptions enable row level security;

drop policy if exists "Users manage their own push subscriptions" on zeeyus_push_subscriptions;
create policy "Users manage their own push subscriptions"
on zeeyus_push_subscriptions for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- title: stored at reminder-creation time so send-reminders doesn't
-- need a TMDB round-trip per reminder just to write the notification
-- text.
-- notified_at: set once a push has actually been sent for this
-- reminder, so the scheduled function never double-sends.
alter table zeeyus_reminders add column if not exists title text;
alter table zeeyus_reminders add column if not exists notified_at timestamptz;

-- Tracks what the "AI announcement" (notify-recommendations) last
-- pushed to this user, so it never re-announces the same pick and
-- only fires again once the headline recommendation actually changes.
alter table zeeyus_taste_profile add column if not exists last_notified_pick text;
alter table zeeyus_taste_profile add column if not exists last_notified_at timestamptz;
