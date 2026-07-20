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

export async function trendingOnProvider(providerKey, mediaType = 'movie', region = 'US', count = 10, page = 1) {
  const provider = PROVIDERS[providerKey];
  if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
  const data = await api(
    `/discover/${mediaType}`,
    `watch_region=${region}&with_watch_providers=${provider.id}&sort_by=popularity.desc&page=${page}`
  );
  const results = count ? (data.results || []).slice(0, count) : (data.results || []);
  return { results, totalPages: data.total_pages || 1 };
}

export function getTrending(mediaType = 'all', window = 'week', page = 1) {
  return api(`/trending/${mediaType}/${window}`, `page=${page}`);
}

// Returns { results, totalPages }. `count` limits how many to return for
// compact home-row display (pass null/0 for the full page, used by the
// "See all" load-more views).
export async function resolveCategory(cat, pageMediaType = 'movie', page = 1, count = null) {
  const today = new Date().toISOString().slice(0, 10);
  const month = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
  const mt = cat.mediaType || pageMediaType;
  if (cat.kind === 'trending') {
    const data = await getTrending(mt, cat.window, page);
    const results = count ? (data.results || []).slice(0, count) : (data.results || []);
    return { results, totalPages: data.total_pages || 1 };
  }
  if (cat.kind === 'provider') {
    return trendingOnProvider(cat.provider, mt, 'US', count, page);
  }
  if (cat.kind === 'keyword-terms') {
    return discoverByKeywordTerms(mt, cat.terms, cat.extraParams || 'sort_by=popularity.desc', page, count);
  }
  const params = typeof cat.params === 'function' ? cat.params(today, month) : cat.params;
  const data = await discover(mt, `${params}&page=${page}`);
  const results = count ? (data.results || []).slice(0, count) : (data.results || []);
  return { results, totalPages: data.total_pages || 1 };
}

export function getPopular(mediaType = 'movie') {
  return api(`/${mediaType}/popular`);
}

export function discover(mediaType, params) {
  return api(`/discover/${mediaType}`, params);
}

// Live provider list (name + logo) straight from TMDB — no logo assets
// or provider IDs to hand-maintain. Watch-provider data is region-scoped
// (IROKOtv only shows up under NG, JioHotstar only under IN, etc.), so a
// single US query would only ever surface a handful of US majors — this
// merges across the regions that actually cover the platforms requested.
const NETWORK_REGIONS = ['US', 'GB', 'NG', 'ZA', 'IN', 'KR', 'CN', 'JP'];
let providerListCache = null;
export async function getNetworkList() {
  if (providerListCache) return providerListCache;
  const calls = NETWORK_REGIONS.flatMap((region) => [
    { region, promise: api('/watch/providers/movie', `watch_region=${region}`) },
    { region, promise: api('/watch/providers/tv', `watch_region=${region}`) },
  ]);
  const settled = await Promise.all(
    calls.map((c) => c.promise.then((res) => ({ region: c.region, res })).catch(() => ({ region: c.region, res: { results: [] } })))
  );
  const byId = new Map();
  for (const { region, res } of settled) {
    for (const p of res.results || []) {
      if (!byId.has(p.provider_id)) {
        byId.set(p.provider_id, { ...p, regions: new Set([region]) });
      } else {
        byId.get(p.provider_id).regions.add(region);
      }
    }
  }
  // TMDB tracks a lot of add-on-bundle/cross-listing entries alongside
  // real platforms ("AMC+ Roku Premium Channel", "HBO Max on U-Next").
  // Filtered by structural pattern, not a specific-name list, so this
  // doesn't need manual upkeep as new noise appears.
  const NOISE_PATTERN = /(amazon channel|roku premium channel|\bon [A-Z][\w-]+$)/i;

  const list = [...byId.values()]
    .filter((p) => !NOISE_PATTERN.test(p.provider_name))
    .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
    .map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logo: IMG(p.logo_path, 'original'),
      // Prefer US for the discover query if available (better catalog
      // data on TMDB), otherwise fall back to wherever it was found.
      region: p.regions.has('US') ? 'US' : [...p.regions][0],
    }));
  providerListCache = list;
  return list;
}

export function getDetails(mediaType, id) {
  return api(`/${mediaType}/${id}`, 'append_to_response=credits,videos,recommendations');
}

const watchProviderCache = new Map();
export async function getPrimaryProviderId(mediaType, id, region = 'US') {
  const cacheKey = `${mediaType}-${id}`;
  if (watchProviderCache.has(cacheKey)) return watchProviderCache.get(cacheKey);
  const data = await api(`/${mediaType}/${id}/watch/providers`);
  const flatrate = data.results?.[region]?.flatrate || [];
  const known = new Set(Object.values(PROVIDERS).map((p) => p.id));
  const match = flatrate.find((p) => known.has(p.provider_id));
  const providerId = match ? match.provider_id : null;
  watchProviderCache.set(cacheKey, providerId);
  return providerId;
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

export async function discoverByKeywordTerms(mediaType, terms, extraParams = '', page = 1, count = null) {
  const ids = (await Promise.all(terms.map(resolveKeywordId))).filter(Boolean);
  if (!ids.length) return { results: [], totalPages: 1 };
  const data = await discover(mediaType, `with_keywords=${ids.join('|')}&${extraParams}&page=${page}`);
  const results = count ? (data.results || []).slice(0, count) : (data.results || []);
  return { results, totalPages: data.total_pages || 1 };
}
