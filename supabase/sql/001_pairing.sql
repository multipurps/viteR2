-- Run once in Supabase SQL editor for QR desktop login.

create table if not exists zeeyus_pairing (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'pending', -- pending | approved | expired
  user_id uuid,
  email text,
  token_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

alter table zeeyus_pairing enable row level security;

-- Desktop can create its own pending pairing row (code is a long random
-- token — the "secret" is knowing the exact code from the QR, not table
-- access itself).
create policy "anon can create pending pairing" on zeeyus_pairing
  for insert
  with check (status = 'pending' and user_id is null);

-- Desktop polls its own row by code to see when it's approved.
create policy "anon can read pairing by code" on zeeyus_pairing
  for select
  using (true);

-- No update/delete policy for anon — only the Edge Function (service
-- role, which bypasses RLS) can mark a row approved and attach a token.
