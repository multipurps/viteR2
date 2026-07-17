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
  if (cat.kind === 'keyword-terms') {
    return discoverByKeywordTerms(mt, cat.terms, cat.extraParams || 'sort_by=popularity.desc');
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

// Live provider list (name + logo) straight from TMDB — no logo assets
// to store or keep updated ourselves. display_priority is TMDB's own
// ranking of provider prominence in the region.
let providerListCache = null;
export async function getNetworkList(region = 'US') {
  if (providerListCache) return providerListCache;
  const [movieRes, tvRes] = await Promise.all([
    api('/watch/providers/movie', `watch_region=${region}`),
    api('/watch/providers/tv', `watch_region=${region}`),
  ]);
  const byId = new Map();
  for (const p of [...(movieRes.results || []), ...(tvRes.results || [])]) {
    if (!byId.has(p.provider_id)) byId.set(p.provider_id, p);
  }
  const known = new Set(Object.values(PROVIDERS).map((p) => p.id));
  const list = [...byId.values()]
    .filter((p) => known.has(p.provider_id))
    .sort((a, b) => a.display_priority - b.display_priority)
    .map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo: IMG(p.logo_path, 'original'),
      key: Object.entries(PROVIDERS).find(([, v]) => v.id === p.provider_id)?.[0],
    }));
  providerListCache = list;
  return list;
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

// Resolves free-text terms ("vikings", "sword and sandal") to TMDB
// keyword IDs at runtime, so a category like "Ancient Adventures" can
// be defined by what it's about instead of a hand-maintained show list.
const keywordCache = new Map();
export async function resolveKeywordId(term) {
  if (keywordCache.has(term)) return keywordCache.get(term);
  const data = await api('/search/keyword', `query=${encodeURIComponent(term)}`);
  const id = data.results?.[0]?.id ?? null;
  keywordCache.set(term, id);
  return id;
}

export async function discoverByKeywordTerms(mediaType, terms, extraParams = '') {
  const ids = (await Promise.all(terms.map(resolveKeywordId))).filter(Boolean);
  if (!ids.length) return [];
  const data = await discover(mediaType, `with_keywords=${ids.join('|')}&${extraParams}`);
  return data.results || [];
}
