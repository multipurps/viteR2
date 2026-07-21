// supabase/functions/recommend/index.ts
//
// The actual recommendation pipeline. Deterministic scoring does all
// the heavy lifting (candidate generation, filtering, vector match
// against the taste profile) with zero AI calls — the LLM is used
// exactly once per request, at the end, to pick + explain the
// flagship categories from an already-narrowed shortlist. That's the
// entire cost-control strategy: this function's AI spend doesn't grow
// with catalog size, only with request count, and each request is
// capped at ~1 + (a handful of DNA backfills) calls.
//
// Deploy with: supabase functions deploy recommend
// Needs these function secrets set (same as story-dna):
//   supabase secrets set GROQ_API_KEY=...
//   supabase secrets set TMDB_API_KEY=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { generateDna, INTENSITY_KEYS } from '../_shared/dna.ts';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Signed weights per interaction — strength of signal, not just
// direction. watched_pct only matters when there's no explicit
// rating (an explicit "like" after finishing means more than the
// percentage watched).
function interactionWeight(row: { rating?: string; watched_pct?: number }) {
  if (row.rating === 'love') return 3;
  if (row.rating === 'like') return 1.5;
  if (row.rating === 'dislike') return -2;
  if (row.rating === 'not_interested') return -1.5;
  if (typeof row.watched_pct === 'number') {
    if (row.watched_pct >= 85) return 0.75;
    if (row.watched_pct <= 15) return -0.5;
  }
  return 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const tmdbKey = Deno.env.get('TMDB_API_KEY')!;
    const groqKey = Deno.env.get('GROQ_API_KEY')!;

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userErr || !userData.user) return jsonResponse({ error: 'Invalid session' }, 401);
    const userId = userData.user.id;

    // ── 1. Load the user's signal ────────────────────────────────
    const { data: interactions } = await supabase
      .from('zeeyus_interactions')
      .select('tmdb_id, media_type, rating, watched_pct')
      .eq('user_id', userId);

    if (!interactions || interactions.length === 0) {
      return jsonResponse({ new_user: true });
    }

    const { data: watchlist } = await supabase
      .from('zeeyus_watchlist')
      .select('tmdb_id, media_type')
      .eq('user_id', userId);

    const excludeKey = (id: number, type: string) => `${type}:${id}`;
    const excluded = new Set([
      ...interactions.map((r) => excludeKey(r.tmdb_id, r.media_type)),
      ...(watchlist || []).map((r) => excludeKey(r.tmdb_id, r.media_type)),
    ]);

    // ── 2. DNA for rated titles (backfill a bounded number if missing) ─
    const dnaMap = await loadOrBackfillDna(supabase, interactions, tmdbKey, groqKey, 15);

    // ── 3. Build the taste profile ───────────────────────────────
    const profile = buildTasteProfile(interactions, dnaMap);
    if (!profile) return jsonResponse({ new_user: true }); // no rated title had usable DNA

    await supabase.from('zeeyus_taste_profile').upsert({ user_id: userId, profile });

    // ── 4. Candidate pool ─────────────────────────────────────────
    const candidates = await buildCandidatePool(tmdbKey, excluded);

    // ── 5. Score candidates against the profile (DNA-cache-only pass) ─
    const candidateDna = await loadOrBackfillDna(
      supabase,
      candidates.map((c) => ({ tmdb_id: c.id, media_type: c.media_type })),
      tmdbKey,
      groqKey,
      8 // bootstrap at most 8 uncached candidates per request
    );

    const scored = candidates
      .map((c) => {
        const dna = candidateDna.get(excludeKey(c.id, c.media_type));
        if (!dna) return null;
        return { ...c, dna, score: scoreCandidate(profile, dna) };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    if (scored.length === 0) return jsonResponse({ new_user: false, sections: {} });

    // ── 6. Deterministic categories ───────────────────────────────
    const hiddenGems = scored
      .filter((c) => (c.popularity ?? 0) < 15 || (c.vote_count ?? 0) < 500)
      .slice(0, 6);

    const lovedTitles = interactions.filter((i) => i.rating === 'love');
    let becauseYouLoved: { source: { tmdb_id: number; media_type: string }; pick: (typeof scored)[number] } | null = null;
    for (const loved of lovedTitles) {
      const lovedDna = dnaMap.get(excludeKey(loved.tmdb_id, loved.media_type));
      if (!lovedDna) continue;
      const lovedElements = new Set(lovedDna.specific_elements || []);
      const best = scored
        .map((c) => ({ c, overlap: (c.dna.specific_elements || []).filter((e: string) => lovedElements.has(e)).length }))
        .filter((x) => x.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)[0];
      if (best) {
        becauseYouLoved = { source: { tmdb_id: loved.tmdb_id, media_type: loved.media_type }, pick: best.c };
        break;
      }
    }

    // ── 7. One LLM call: pick + explain the flagship categories ────
    const llmSections = await pickFlagshipCategories(profile, scored, groqKey);

    return jsonResponse({
      new_user: false,
      sections: {
        ...llmSections,
        hidden_gems: hiddenGems.map(toClientItem),
        ...(becauseYouLoved
          ? { because_you_loved: { source: becauseYouLoved.source, item: toClientItem(becauseYouLoved.pick) } }
          : {}),
      },
    });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});

// ─────────────────────────────────────────────────────────────────

async function loadOrBackfillDna(
  supabase: ReturnType<typeof createClient>,
  rows: { tmdb_id: number; media_type: string }[],
  tmdbKey: string,
  groqKey: string,
  maxBackfill: number
) {
  const map = new Map<string, any>();
  if (rows.length === 0) return map;

  const { data: cached } = await supabase
    .from('zeeyus_story_dna')
    .select('tmdb_id, media_type, dna')
    .in('tmdb_id', [...new Set(rows.map((r) => r.tmdb_id))]);

  for (const row of cached || []) {
    map.set(`${row.media_type}:${row.tmdb_id}`, row.dna);
  }

  const missing = rows.filter((r) => !map.has(`${r.media_type}:${r.tmdb_id}`)).slice(0, maxBackfill);
  for (const m of missing) {
    try {
      const dna = await generateDna(m.tmdb_id, m.media_type as 'movie' | 'tv', tmdbKey, groqKey);
      map.set(`${m.media_type}:${m.tmdb_id}`, dna);
      await supabase.from('zeeyus_story_dna').upsert({ tmdb_id: m.tmdb_id, media_type: m.media_type, dna });
    } catch {
      // Skip — this title just won't factor into scoring this round.
    }
  }

  return map;
}

function buildTasteProfile(interactions: any[], dnaMap: Map<string, any>) {
  const intensitySum: Record<string, number> = {};
  const intensityWeight: Record<string, number> = {};
  const elementScore = new Map<string, number>();
  let anyUsable = false;

  for (const row of interactions) {
    const dna = dnaMap.get(`${row.media_type}:${row.tmdb_id}`);
    if (!dna) continue;
    const weight = interactionWeight(row);
    if (weight === 0) continue;
    anyUsable = true;

    for (const key of INTENSITY_KEYS) {
      const val = dna[key];
      if (typeof val !== 'number') continue;
      intensitySum[key] = (intensitySum[key] || 0) + val * weight;
      intensityWeight[key] = (intensityWeight[key] || 0) + Math.abs(weight);
    }
    for (const el of dna.specific_elements || []) {
      elementScore.set(el, (elementScore.get(el) || 0) + weight);
    }
  }

  if (!anyUsable) return null;

  const intensity: Record<string, number> = {};
  for (const key of INTENSITY_KEYS) {
    intensity[key] = intensityWeight[key] ? intensitySum[key] / intensityWeight[key] : 5;
  }

  const ranked = [...elementScore.entries()].sort((a, b) => b[1] - a[1]);
  const signatureElements = ranked.filter(([, s]) => s > 0).slice(0, 15).map(([e]) => e);
  const avoidElements = ranked.filter(([, s]) => s < 0).slice(0, 10).map(([e]) => e);

  return { intensity, signature_elements: signatureElements, avoid_elements: avoidElements };
}

async function buildCandidatePool(tmdbKey: string, excluded: Set<string>) {
  const endpoints = [
    `${TMDB_BASE}/trending/movie/week?api_key=${tmdbKey}`,
    `${TMDB_BASE}/trending/tv/week?api_key=${tmdbKey}`,
    `${TMDB_BASE}/movie/popular?api_key=${tmdbKey}`,
    `${TMDB_BASE}/tv/popular?api_key=${tmdbKey}`,
    `${TMDB_BASE}/movie/top_rated?api_key=${tmdbKey}`,
    `${TMDB_BASE}/tv/top_rated?api_key=${tmdbKey}`,
  ];

  const pages = await Promise.all(endpoints.map((u) => fetch(u).then((r) => r.json()).catch(() => ({ results: [] }))));
  const seen = new Set<string>();
  const pool: any[] = [];

  pages.forEach((page, i) => {
    const mediaType = i % 2 === 0 ? 'movie' : 'tv';
    for (const item of page.results || []) {
      if (!item.poster_path) continue;
      const key = `${mediaType}:${item.id}`;
      if (excluded.has(key) || seen.has(key)) continue;
      seen.add(key);
      pool.push({
        id: item.id,
        media_type: mediaType,
        title: item.title || item.name,
        poster_path: item.poster_path,
        popularity: item.popularity,
        vote_count: item.vote_count,
      });
    }
  });

  return pool.slice(0, 80);
}

function scoreCandidate(profile: ReturnType<typeof buildTasteProfile>, dna: any) {
  if (!profile) return 0;

  // Intensity similarity: 1 - normalized distance, averaged.
  let intensityScore = 0;
  let n = 0;
  for (const key of INTENSITY_KEYS) {
    if (typeof dna[key] !== 'number') continue;
    intensityScore += 1 - Math.abs(profile.intensity[key] - dna[key]) / 9;
    n += 1;
  }
  intensityScore = n ? intensityScore / n : 0.5;

  const candidateElements: string[] = dna.specific_elements || [];
  const sigHits = candidateElements.filter((e) => profile.signature_elements.includes(e)).length;
  const avoidHits = candidateElements.filter((e) => profile.avoid_elements.includes(e)).length;
  const elementScore = sigHits * 0.15 - avoidHits * 0.2;

  return intensityScore + elementScore;
}

function toClientItem(c: any) {
  return { id: c.id, media_type: c.media_type, title: c.title, poster_path: c.poster_path };
}

async function pickFlagshipCategories(profile: any, scored: any[], groqKey: string) {
  const shortlist = scored.slice(0, 15).map((c, i) => ({
    index: i,
    title: c.title,
    premise: c.dna.premise,
    specific_elements: c.dna.specific_elements,
    tone: c.dna.tone,
  }));

  const prompt = `You are picking personalized recommendations for a streaming app user, from a pre-scored shortlist. Their taste profile's top signature story elements (things they consistently respond to across titles they loved): ${JSON.stringify(profile.signature_elements)}. Elements they tend to dislike: ${JSON.stringify(profile.avoid_elements)}.

Shortlist (already filtered/scored against their taste, ranked best-first):
${JSON.stringify(shortlist)}

Pick DIFFERENT titles (by index) for each of these four categories — do not reuse the same index twice:
- "gem_for_you": the strongest unexpected pick — matches their deeper taste signals even if it doesn't look obviously similar to what they usually watch.
- "next_obsession": your single highest-confidence pick for something they'll love.
- "same_energy": something that recreates the FEELING/experience of their favorites without being a genre copy.
- "unexpected": a cross-genre pick justified by shared story elements, not shared genre.

For each, write a short (1-2 sentence) explanation naming the SPECIFIC shared elements/reasons — never say "because you watched X" or mention genre alone as the reason.

Respond with ONLY this JSON shape, no prose:
{"gem_for_you": {"index": N, "explanation": "..."}, "next_obsession": {...}, "same_energy": {...}, "unexpected": {...}}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) return {};
  const data = await res.json();
  const picks = JSON.parse(data.choices[0].message.content);

  const sections: Record<string, any> = {};
  for (const [key, val] of Object.entries<any>(picks)) {
    const item = scored[val?.index];
    if (!item) continue;
    sections[key] = { item: toClientItem(item), explanation: val.explanation };
  }
  return sections;
}
