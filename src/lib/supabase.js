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

export function signInWithEmail(email) {
  return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
}

// Email + password — works on devices (TVs, etc.) where the Google OAuth
// redirect and magic-link flows can't complete on the same session.
export function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signUpWithPassword(email, password) {
  return supabase.auth.signUp({ email, password });
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

// ── QR / TV-code desktop pairing ──
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easy to read off a TV
function randomCode(len = 6) {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return out;
}

export async function createPairing() {
  const code = randomCode();
  const { error } = await supabase.from('zeeyus_pairing').insert({ code, status: 'pending' });
  if (error) throw error;
  return code;
}

export function watchPairing(code, onChange) {
  const channel = supabase
    .channel(`pairing-${code}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'zeeyus_pairing', filter: `code=eq.${code}` },
      (payload) => onChange(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export async function getPairingOnce(code) {
  const { data } = await supabase.from('zeeyus_pairing').select('*').eq('code', code).maybeSingle();
  return data;
}

// Real Netflix Top 10 (titles only) via the netflix-top10 Edge Function —
// falls back to null on any failure so callers can gracefully use the
// TMDB-popularity estimate instead.
export async function getNetflixTop10(type = 'tv') {
  const { data, error } = await supabase.functions.invoke('netflix-top10', { body: { type } });
  if (error) throw error;
  return data?.titles || [];
}

export async function approvePairing(code) {
  const session = await getSession();
  if (!session) throw new Error('Not signed in');
  const { error } = await supabase.functions.invoke('approve-pairing', {
    body: { code },
  });
  if (error) throw error;
}

export async function redeemPairing(email, tokenHash) {
  const { error } = await supabase.auth.verifyOtp({ email, token: tokenHash, type: 'magiclink' });
  if (error) throw error;
}

// ── Recommendations (Story DNA engine) ──

export async function rateTitle(userId, mediaType, tmdbId, rating, reasons = [], mediaData = null) {
  // Rating a title implies you watched it — mark it watched_pct: 100 so
  // it shows up on the Rated/Watched page and the recommend function's
  // "abandoned" signal doesn't misread it later.
  const row = {
    user_id: userId,
    media_type: mediaType,
    tmdb_id: tmdbId,
    rating,
    reasons,
    watched_pct: 100,
    updated_at: new Date().toISOString(),
  };
  if (mediaData) row.media_data = mediaData;

  const { error } = await supabase.from('zeeyus_interactions').upsert(row, {
    onConflict: 'user_id,tmdb_id,media_type',
  });
  if (error) throw error;
}

export async function getUserRating(userId, tmdbId, mediaType) {
  const { data } = await supabase
    .from('zeeyus_interactions')
    .select('rating, reasons')
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType)
    .maybeSingle();
  return data || null;
}

// Powers the "Rated / Watched" page under Profile.
export async function getRatedTitles(userId) {
  const { data, error } = await supabase
    .from('zeeyus_interactions')
    .select('tmdb_id, media_type, rating, reasons, media_data, updated_at')
    .eq('user_id', userId)
    .not('rating', 'is', null)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Ratings made before the media_data snapshot column existed have it
// null — this backfills one row at a time as the Rated page discovers
// them, so they only ever need fetching from TMDB once.
export async function backfillInteractionSnapshot(userId, tmdbId, mediaType, mediaData) {
  const { error } = await supabase
    .from('zeeyus_interactions')
    .update({ media_data: mediaData })
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);
  if (error) throw error;
}

// Suggested "what did you love about this" chips come from the same
// cached DNA the recommend pipeline uses — first call for a title
// costs one Groq request, every call after is free (cache hit).
export async function getStoryDna(tmdbId, mediaType) {
  const { data, error } = await supabase.functions.invoke('story-dna', {
    body: { tmdb_id: tmdbId, media_type: mediaType },
  });
  if (error) throw error;
  return data?.dna || null;
}

// Calls the recommend Edge Function. Returns { new_user: true } for
// users with no ratings yet, or { new_user: false, sections: {...} }.
export async function getRecommendations() {
  const { data, error } = await supabase.functions.invoke('recommend', { body: {} });
  if (error) throw error;
  return data;
}

export async function getUserInteractions(userId) {
  const { data, error } = await supabase
    .from('zeeyus_interactions')
    .select('tmdb_id, media_type, rating')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

// ── Coming Soon reminders ──

export async function addReminder(userId, tmdbId, mediaType, releaseDate, title) {
  const { error } = await supabase.from('zeeyus_reminders').upsert(
    { user_id: userId, tmdb_id: tmdbId, media_type: mediaType, release_date: releaseDate || null, title: title || null },
    { onConflict: 'user_id,tmdb_id,media_type' }
  );
  if (error) throw error;
}

export async function removeReminder(userId, tmdbId, mediaType) {
  const { error } = await supabase
    .from('zeeyus_reminders')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId)
    .eq('media_type', mediaType);
  if (error) throw error;
}

export async function getReminders(userId) {
  const { data, error } = await supabase.from('zeeyus_reminders').select('*').eq('user_id', userId);
  if (error) throw error;
  return data || [];
}
