// supabase/functions/netflix-top10/index.ts
//
// Netflix is the only major streaming platform that publishes an
// official, real Top 10 (netflix.com/tudum/top10) — everyone else
// (Disney+, Prime, HBO Max, Apple TV+, Hulu) has no public official
// chart at all, so this proxy is Netflix-specific by necessity.
//
// A browser can't fetch netflix.com directly from Zeeyus due to CORS,
// so this runs server-side and just relays parsed JSON back.
//
// Fragile by nature: this parses Netflix's public HTML page rather
// than a stable versioned API (because Netflix doesn't offer one), so
// it can break if Netflix changes their page markup. If results come
// back empty, that's the first thing to check — the regex may need
// updating to match Netflix's current HTML structure.
//
// Deploy with: supabase functions deploy netflix-top10

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { type: rawType } = await req.json().catch(() => ({}));
    const type = rawType === 'movies' ? 'movies' : 'tv';

    const res = await fetch(`https://www.netflix.com/tudum/top10/${type === 'movies' ? 'films' : 'tv'}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Zeeyus/1.0)' },
    });
    if (!res.ok) throw new Error(`Netflix page fetch failed: ${res.status}`);
    const html = await res.text();

    // Poster <img alt="..."> attributes appear in ranked order in the
    // "Global Top 10" list — a more stable target than class names,
    // which Netflix's build system tends to hash/rotate.
    const altMatches = [...html.matchAll(/<img[^>]+alt="([^"]+)"[^>]*>/g)].map((m) => m[1]);

    const seen = new Set();
    const titles = [];
    for (const alt of altMatches) {
      const clean = alt.replace(/:\s*(Season \d+|Limited Series|Part \d+).*$/i, '').trim();
      if (!clean || seen.has(clean)) continue;
      seen.add(clean);
      titles.push(clean);
      if (titles.length >= 10) break;
    }

    return new Response(JSON.stringify({ type, titles, source: 'netflix.com/tudum/top10', fetchedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
