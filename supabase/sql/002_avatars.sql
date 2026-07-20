-- Run once in Supabase SQL editor. Assumes the "avatars" bucket has
-- already been created (Storage → New bucket → name "avatars" →
-- Public on).

-- 1. Profile-picture column.
alter table zeeyus_profiles add column if not exists avatar_url text;

-- 2. Storage policies for the "avatars" bucket.
-- Marking a bucket "Public" only skips RLS for reads made through the
-- public URL — uploads/updates/deletes from the client still go
-- through storage.objects RLS, so without these the upload in
-- uploadAvatar() fails with a permissions error even though the
-- bucket itself is public.
--
-- Uploads are written to `${userId}/avatar.${ext}` (see uploadAvatar
-- in src/lib/supabase.js), so each policy checks that the first path
-- segment matches the requesting user's own id.

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
