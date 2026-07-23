// supabase/functions/_shared/webpush.ts
import webpush from 'npm:web-push@3.6.7';

let configured = false;

function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!
  );
  configured = true;
}

// Sends to every device the user has subscribed on. Dead subscriptions
// (410/404 — permission revoked, browser data cleared, etc.) are
// deleted as they're discovered, so this table doesn't just grow
// forever with subscriptions nothing can ever be delivered to.
export async function sendPushToUser(
  supabase: any,
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  configure();

  const { data: subs } = await supabase
    .from('zeeyus_push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return 0;

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        await supabase.from('zeeyus_push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }
  return sent;
}
