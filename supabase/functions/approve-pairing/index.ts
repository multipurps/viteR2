// supabase/functions/approve-pairing/index.ts
//
// Called from the *mobile* device (already signed in) after it scans
// the desktop's QR code and taps "Confirm". Needs the service role key
// because minting an OTP for another session requires admin rights —
// that's why this can't just be a client-side Supabase call.
//
// Deploy with: supabase functions deploy approve-pairing
// (needs SUPABASE_SERVICE_ROLE_KEY set as a function secret — Supabase
// sets SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY automatically for
// Edge Functions, no manual config needed)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the caller is who they claim to be — this is the mobile
    // device's own session token, not the pairing code.
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData.user) throw new Error('Invalid session');
    const user = userData.user;

    // Confirm this account is actually approved — a pending/blocked
    // account can't authorize a new device either.
    const { data: profile } = await supabaseAdmin
      .from('zeeyus_profiles')
      .select('approved')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.approved !== true) throw new Error('Account not approved');

    const { code } = await req.json();
    if (!code) throw new Error('Missing code');

    const { data: pairing, error: pairErr } = await supabaseAdmin
      .from('zeeyus_pairing')
      .select('*')
      .eq('code', code)
      .eq('status', 'pending')
      .maybeSingle();
    if (pairErr || !pairing) throw new Error('Pairing code not found or already used');
    if (new Date(pairing.expires_at) < new Date()) throw new Error('Pairing code expired');

    // Mint a one-time magic-link token the desktop will redeem via
    // supabase.auth.verifyOtp — never send back a full session/refresh
    // token over this channel, only a single-use OTP.
    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    });
    if (linkErr) throw linkErr;

    const tokenHash = link.properties?.hashed_token;

    await supabaseAdmin
      .from('zeeyus_pairing')
      .update({ status: 'approved', user_id: user.id, email: user.email, token_hash: tokenHash })
      .eq('code', code);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
