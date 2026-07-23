// supabase/functions/recommend/index.ts
//
// Thin wrapper: resolves the caller's userId from their session, then
// runs the shared pipeline (see _shared/pipeline.ts — the same code
// notify-recommendations uses on a schedule, so the two never drift
// apart).
//
// Deploy with: supabase functions deploy recommend
// Needs these function secrets set (same as story-dna):
//   supabase secrets set GROQ_API_KEY=...
//   supabase secrets set TMDB_API_KEY=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { runRecommendationPipeline } from '../_shared/pipeline.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userErr || !userData.user) return jsonResponse({ error: 'Invalid session' }, 401);

    const result = await runRecommendationPipeline(
      supabase,
      Deno.env.get('TMDB_API_KEY')!,
      Deno.env.get('GROQ_API_KEY')!,
      userData.user.id
    );

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
