import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, onAuthStateChange, getSession, ensureProfile, approvalLabel } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setSession(null); setLoading(false); return; }

    getSession().then(async (s) => {
      setSession(s);
      if (s?.user) setProfile(await ensureProfile(s.user).catch(() => null));
      setLoading(false);
    });

    const { data: sub } = onAuthStateChange(async (s) => {
      setSession(s);
      if (s?.user) {
        setProfile(await ensureProfile(s.user).catch(() => null));
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    status: session?.user ? approvalLabel(profile) : 'signed-out',
    loading,
    refreshProfile: async () => {
      if (session?.user) setProfile(await ensureProfile(session.user).catch(() => null));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
