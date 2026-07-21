// supabase/functions/_shared/dna.ts
//
// Story DNA generation — shared by story-dna (on-demand, single title)
// and recommend (bootstraps DNA for a handful of uncached candidates
// per request, see recommend/index.ts for why that's capped).

const TMDB_BASE = 'https://api.themoviedb.org/3';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const DNA_SCHEMA_PROMPT = `You are a film/TV story analyst. Given metadata about a title, output ONLY a JSON object (no prose, no markdown fences) with this exact shape:

{
  "premise": "one sentence, the core story concept",
  "setting": "string",
  "time_period": "string",
  "themes": ["string", ...],
  "plot_devices": ["string", ...],
  "protagonist_traits": ["string", ...],
  "tone": "string",
  "pacing": "slow" | "medium" | "fast",
  "narrative_complexity": 1-10,
  "emotional_intensity": 1-10,
  "action_intensity": 1-10,
  "comedy_intensity": 1-10,
  "romance_intensity": 1-10,
  "mystery_intensity": 1-10,
  "suspense_intensity": 1-10,
  "realism": 1-10,
  "specific_elements": ["snake_case_tag", ...]
}

"specific_elements" is the most important field: don't limit yourself to genre words. Identify concrete, distinctive story mechanics and situations — e.g. time_travel, body_swap, fish_out_of_water, food_and_cooking, palace_politics, prison_escape, cartel_conspiracy, found_family, revenge_plot, unreliable_narrator, dual_timeline, coming_of_age, chosen_one, class_divide, survival_against_odds. Invent new tags freely when the obvious ones don't capture it — these tags are what actually drives good recommendations, more than genre does. Include 5-12 of them, most distinctive first.

Base this on the actual plot/premise described, not just the genre label.`;

export async function generateDna(tmdbId: number, mediaType: 'movie' | 'tv', tmdbKey: string, groqKey: string) {
  const [details, keywords, credits] = await Promise.all([
    fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}?api_key=${tmdbKey}`).then((r) => r.json()),
    fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}/keywords?api_key=${tmdbKey}`).then((r) => r.json()),
    fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}/credits?api_key=${tmdbKey}`).then((r) => r.json()),
  ]);

  const keywordList = (keywords.keywords || keywords.results || []).map((k: { name: string }) => k.name);
  const cast = (credits.cast || []).slice(0, 5).map((c: { name: string }) => c.name);
  const director = (credits.crew || []).find((c: { job: string }) => c.job === 'Director')?.name;

  const metadata = {
    title: details.title || details.name,
    overview: details.overview,
    genres: (details.genres || []).map((g: { name: string }) => g.name),
    keywords: keywordList,
    cast,
    director,
    year: (details.release_date || details.first_air_date || '').slice(0, 4),
    country: (details.production_countries || [])[0]?.name,
    language: details.original_language,
  };

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: DNA_SCHEMA_PROMPT },
        { role: 'user', content: JSON.stringify(metadata) },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!groqRes.ok) throw new Error(`Groq request failed: ${groqRes.status}`);
  const groqData = await groqRes.json();
  return JSON.parse(groqData.choices[0].message.content);
}

export const INTENSITY_KEYS = [
  'narrative_complexity', 'emotional_intensity', 'action_intensity',
  'comedy_intensity', 'romance_intensity', 'mystery_intensity',
  'suspense_intensity', 'realism',
] as const;
