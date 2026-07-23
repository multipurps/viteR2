// supabase/functions/notify-recommendations/index.ts
//
// The "AI makes an announcement" feature — runs the same pipeline as
// recommend, but on a schedule instead of a page visit, and pushes a
// notification when it finds something worth surfacing.
//
// Eligible users = anyone with a taste profile already (i.e. they've
// rated enough to have one) who hasn't been notified in the last
// NOTIFY_COOLDOWN_DAYS. Only notifies if the headline pick is actually
// different from last time — re-running the same pipeline on the same
// data would otherwise re-notify about the same title forever.
//
// Deploy with: supabase functions deploy notify-recommendations
// Same secrets as recommend + send-reminders (GROQ_API_KEY,
// TMDB_API_KEY, VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).
//
// Cost note: this runs the full pipeline (deterministic scoring + one
// Groq call) once PER ELIGIBLE USER per run, not once total — budget
// the cron interval accordingly for however many users you have.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse } from '../_shared/cors.ts';
import { runRecommendationPipeline } from '../_shared/pipeline.ts';
import { sendPushToUser } from '../_shared/webpush.ts';

const NOTIFY_COOLDOWN_DAYS = 6;

const CATEGORY_LABEL: Record<string, string> = {
  next_obsession: 'Your Next Obsession',
  gem_for_you: 'Gem for You',
  same_energy: 'Same Energy, Different Story',
  unexpected: 'You May Not Expect This',
};

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const tmdbKey = Deno.env.get('TMDB_API_KEY')!;
    const groqKey = Deno.env.get('GROQ_API_KEY')!;

    const cutoff = new Date(Date.now() - NOTIFY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: profiles } = await supabase
      .from('zeeyus_taste_profile')
      .select('user_id, last_notified_pick, last_notified_at')
      .or(`last_notified_at.is.null,last_notified_at.lt.${cutoff}`);

    if (!profiles || profiles.length === 0) return jsonResponse({ checked: 0, notified: 0 });

    let notified = 0;
    for (const p of profiles) {
      const result: any = await runRecommendationPipeline(supabase, tmdbKey, groqKey, p.user_id);
      if (!result || result.new_user || !result.sections) continue;

      const headlineKey = ['next_obsession', 'gem_for_you', 'same_energy', 'unexpected'].find(
        (k) => result.sections[k]
      );
      if (!headlineKey) continue;

      const pick = result.sections[headlineKey];
      const pickKey = `${pick.item.media_type}:${pick.item.id}`;

      // Same title as last announcement — nothing new to say.
      if (pickKey === p.last_notified_pick) continue;

      const count = await sendPushToUser(supabase, p.user_id, {
        title: `${CATEGORY_LABEL[headlineKey]}: ${pick.item.title}`,
        body: pick.explanation || 'The AI found something it thinks you\'ll love.',
        url: `/${pick.item.media_type}/${pick.item.id}`,
      });

      await supabase
        .from('zeeyus_taste_profile')
        .update({ last_notified_pick: pickKey, last_notified_at: new Date().toISOString() })
        .eq('user_id', p.user_id);

      if (count > 0) notified++;
    }

    return jsonResponse({ checked: profiles.length, notified });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
