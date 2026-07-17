import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
}) : null;

// ── Auth ──
export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({ provider: 'google' });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(cb) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session));
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ── Approval gate ──
// First sign-in creates a `zeeyus_profiles` row with approved:false
// (pending). You approve/block from /admin, same as before — this
// just makes sure a row exists so it shows up there.
export async function ensureProfile(user) {
  const { data: existing } = await supabase
    .from('zeeyus_profiles')
    .select('id, approved, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('zeeyus_profiles')
    .insert({ id: user.id, email: user.email, approved: false })
    .select('id, approved, avatar_url')
    .single();
  if (error) throw error;
  return data;
}

// approved === true -> 'approved', 'blocked' -> 'blocked', else -> 'pending'
export function approvalLabel(profile) {
  if (!profile) return 'pending';
  if (profile.approved === true) return 'approved';
  if (profile.approved === 'blocked') return 'blocked';
  return 'pending';
}

export async function updateAvatar(userId, avatarUrl) {
  const { error } = await supabase
    .from('zeeyus_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId);
  if (error) throw error;
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  await updateAvatar(userId, data.publicUrl);
  return data.publicUrl;
}

// ── Watchlist ──
export async function getWatchlist(userId) {
  const { data, error } = await supabase
    .from('zeeyus_watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addToWatchlist(userId, mediaType, mediaData) {
  const { error } = await supabase.from('zeeyus_watchlist').upsert(
    {
      user_id: userId,
      media_id: String(mediaData.id),
      media_type: mediaType,
      media_data: { ...mediaData, _type: mediaType },
      created_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,media_id,media_type' }
  );
  if (error) throw error;
}

export async function removeFromWatchlist(userId, mediaId, mediaType) {
  const { error } = await supabase
    .from('zeeyus_watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('media_id', String(mediaId))
    .eq('media_type', mediaType);
  if (error) throw error;
}

export async function isInWatchlist(userId, mediaId, mediaType) {
  const { data } = await supabase
    .from('zeeyus_watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('media_id', String(mediaId))
    .eq('media_type', mediaType)
    .maybeSingle();
  return !!data;
}

// ── Continue watching ──
export async function getContinueWatching(userId, limit = 20) {
  const { data, error } = await supabase
    .from('zeeyus_continue')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function upsertProgress(userId, mediaType, mediaData, progress, season, episode) {
  const { error } = await supabase.from('zeeyus_continue').upsert(
    {
      user_id: userId,
      media_id: String(mediaData.id),
      media_type: mediaType,
      media_data: { ...mediaData, _type: mediaType },
      progress,
      season: season ?? null,
      episode: episode ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,media_id,media_type' }
  );
  if (error) throw error;
}

export async function removeFromContinue(userId, mediaId, mediaType) {
  const { error } = await supabase
    .from('zeeyus_continue')
    .delete()
    .eq('user_id', userId)
    .eq('media_id', String(mediaId))
    .eq('media_type', mediaType);
  if (error) throw error;
}
