import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

// Approval-gate helper: after Google OAuth, check the `approved_users`
// table. New sign-ins land as `pending` until you (the owner) flip
// them to `approved` from /admin. Default-deny, not default-allow.
export async function getApprovalStatus(userId) {
  if (!supabase) return 'unconfigured';
  const { data, error } = await supabase
    .from('approved_users')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.status ?? 'pending';
}
