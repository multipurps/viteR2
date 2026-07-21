// supabase/functions/story-dna/index.ts
//
// Given a title, returns its Story DNA — checking zeeyus_story_dna
// first, generating via Groq only on a cache miss. DNA is permanent
// (a title's story doesn't change), so this is the entire cost-control
// strategy for the recommendation engine: every title gets analyzed
// by the LLM at most once, ever, no matter how many users see it or
// how many times it's scored as a candidate.
//
// Deploy with: supabase functions deploy story-dna
// Needs these function secrets set:
//   supabase secrets set GROQ_API_KEY=...
//   supabase secrets set TMDB_API_KEY=...
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided automatically)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { generateDna } from '../_shared/dna.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { tmdb_id, media_type } = await req.json();
    if (!tmdb_id || (media_type !== 'movie' && media_type !== 'tv')) {
      return jsonResponse({ error: 'tmdb_id and media_type (movie|tv) are required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: cached } = await supabase
      .from('zeeyus_story_dna')
      .select('dna')
      .eq('tmdb_id', tmdb_id)
      .eq('media_type', media_type)
      .maybeSingle();

    if (cached) return jsonResponse({ dna: cached.dna, cached: true });

    const dna = await generateDna(
      tmdb_id,
      media_type,
      Deno.env.get('TMDB_API_KEY')!,
      Deno.env.get('GROQ_API_KEY')!
    );

    // Best-effort cache write — a failed insert shouldn't fail the
    // response, just means this title regenerates next time too.
    await supabase.from('zeeyus_story_dna').upsert({ tmdb_id, media_type, dna });

    return jsonResponse({ dna, cached: false });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
