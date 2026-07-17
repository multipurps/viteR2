const KEY = import.meta.env.VITE_TMDB_KEY;
const BASE = 'https://api.themoviedb.org/3';
export const IMG = (path, size = 'w780') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;

async function api(path, params = '') {
  const res = await fetch(`${BASE}${path}?api_key=${KEY}&${params}`);
  if (!res.ok) throw new Error(`TMDB ${path} failed: ${res.status}`);
  return res.json();
}

// TMDB watch_provider IDs (US region). These let us build an honest
// "trending on <platform>" list via /discover, sorted by popularity.
// This is NOT the platform's official internal chart (no public API
// exposes that anywhere) — it's TMDB popularity filtered to titles
// available on that provider. Label it as such in the UI.
export const PROVIDERS = {
  netflix: { id: 8, label: 'Netflix' },
  prime: { id: 9, label: 'Prime Video' },
  hulu: { id: 15, label: 'Hulu' },
  appletv: { id: 350, label: 'Apple TV+' },
  hbomax: { id: 1899, label: 'HBO Max' },
  disney: { id: 337, label: 'Disney+' },
};

export async function trendingOnProvider(providerKey, mediaType = 'movie', region = 'US', count = 10) {
  const provider = PROVIDERS[providerKey];
  if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
  const data = await api(
    `/discover/${mediaType}`,
    `watch_region=${region}&with_watch_providers=${provider.id}&sort_by=popularity.desc&page=1`
  );
  return (data.results || []).slice(0, count);
}

export function getTrending(mediaType = 'all', window = 'week') {
  return api(`/trending/${mediaType}/${window}`);
}

export async function resolveCategory(cat, pageMediaType = 'movie') {
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
  const mt = cat.mediaType || pageMediaType;
  if (cat.kind === 'trending') {
    const data = await getTrending(mt, cat.window);
    return data.results || [];
  }
  if (cat.kind === 'provider') {
    return trendingOnProvider(cat.provider, mt, 'US', 20);
  }
  const params = typeof cat.params === 'function' ? cat.params(today, month) : cat.params;
  const data = await discover(mt, params);
  return data.results || [];
}

export function getPopular(mediaType = 'movie') {
  return api(`/${mediaType}/popular`);
}

export function discover(mediaType, params) {
  return api(`/discover/${mediaType}`, params);
}

export function getDetails(mediaType, id) {
  return api(`/${mediaType}/${id}`, 'append_to_response=credits,videos,recommendations');
}

export function getSeason(tvId, seasonNumber) {
  return api(`/tv/${tvId}/season/${seasonNumber}`);
}

export function searchMulti(query) {
  return api('/search/multi', `query=${encodeURIComponent(query)}`);
}
