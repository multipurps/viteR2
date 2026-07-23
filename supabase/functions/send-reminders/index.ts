// supabase/functions/send-reminders/index.ts
//
// Meant to run on a schedule (see README for the pg_cron setup), not
// from the client. Finds reminders whose release_date has arrived and
// hasn't been notified yet, sends one push per user per title, marks
// it notified so it never sends twice.
//
// Deploy with: supabase functions deploy send-reminders
// Needs these function secrets (in addition to the existing ones):
//   supabase secrets set VAPID_SUBJECT=mailto:you@example.com
//   supabase secrets set VAPID_PUBLIC_KEY=...
//   supabase secrets set VAPID_PRIVATE_KEY=...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { jsonResponse } from '../_shared/cors.ts';
import { sendPushToUser } from '../_shared/webpush.ts';

Deno.serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().slice(0, 10);

    const { data: due } = await supabase
      .from('zeeyus_reminders')
      .select('user_id, tmdb_id, media_type, title, release_date')
      .lte('release_date', today)
      .is('notified_at', null);

    if (!due || due.length === 0) return jsonResponse({ sent: 0 });

    let sent = 0;
    for (const reminder of due) {
      const count = await sendPushToUser(supabase, reminder.user_id, {
        title: `${reminder.title || 'A title you were waiting for'} is out now`,
        body: 'You asked to be reminded — it just released.',
        url: `/${reminder.media_type}/${reminder.tmdb_id}`,
      });
      if (count > 0) sent += count;

      // Mark notified regardless of delivery success (no live
      // subscription is not something retrying will fix) so this
      // reminder is never processed again.
      await supabase
        .from('zeeyus_reminders')
        .update({ notified_at: new Date().toISOString() })
        .eq('user_id', reminder.user_id)
        .eq('tmdb_id', reminder.tmdb_id)
        .eq('media_type', reminder.media_type);
    }

    return jsonResponse({ processed: due.length, sent });
  } catch (err) {
    return jsonResponse({ error: String(err) }, 500);
  }
});
