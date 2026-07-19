import { useEffect, useState } from 'react';
import { supabase, signInWithGoogle, signOut, getSession, onAuthStateChange } from '../lib/supabase';
import './Admin.css';

const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL; // set this to lock the page to just you

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [profiles, setProfiles] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSession().then(setSession);
    const { data: sub } = onAuthStateChange(setSession);
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user;
  const isOwner = user && (!OWNER_EMAIL || user.email === OWNER_EMAIL);

  useEffect(() => {
    if (!isOwner) return;
    load();
  }, [isOwner]);

  async function load() {
    const { data, error } = await supabase
      .from('zeeyus_profiles')
      .select('*')
      .order('id', { ascending: false });
    if (error) { setError(error.message); return; }
    setProfiles(data || []);
  }

  async function setStatus(id, approved) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, approved } : p)));
    const { error } = await supabase.from('zeeyus_profiles').update({ approved }).eq('id', id);
    if (error) { setError(error.message); load(); }
  }

  if (session === undefined) {
    return <div className="admin-page"><p className="admin-loading">Loading…</p></div>;
  }

  if (!user) {
    return (
      <div className="admin-page admin-gate">
        <h1>Zeeyus Admin</h1>
        <button className="admin-google-btn" onClick={() => signInWithGoogle()}>Sign in with Google</button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="admin-page admin-gate">
        <p className="admin-denied">This page is owner-only.</p>
        <button className="admin-signout" onClick={() => signOut()}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin — Approvals</h1>
        <button className="admin-signout" onClick={() => signOut()}>Sign out</button>
      </div>
      {error && <p className="admin-error">{error}</p>}
      {profiles === null && <p className="admin-loading">Loading…</p>}

      <div className="admin-list">
        {profiles?.map((p) => (
          <div key={p.id} className="admin-row glass">
            <div className="admin-row-avatar">
              {p.avatar_url ? <img src={p.avatar_url} alt="" /> : <span>{(p.email || '?')[0].toUpperCase()}</span>}
            </div>
            <div className="admin-row-info">
              <span className="admin-row-email">{p.email}</span>
              <span className={`admin-row-badge badge-${statusOf(p)}`}>{statusOf(p)}</span>
            </div>
            <div className="admin-row-actions">
              <button className="admin-btn approve" disabled={p.approved === true} onClick={() => setStatus(p.id, true)}>Approve</button>
              <button className="admin-btn block" disabled={p.approved === 'blocked'} onClick={() => setStatus(p.id, 'blocked')}>Block</button>
              {p.approved !== false && (
                <button className="admin-btn reset" onClick={() => setStatus(p.id, false)}>Reset to pending</button>
              )}
            </div>
          </div>
        ))}
        {profiles?.length === 0 && <p className="admin-loading">No sign-ins yet.</p>}
      </div>
    </div>
  );
}

function statusOf(p) {
  if (p.approved === true) return 'approved';
  if (p.approved === 'blocked') return 'blocked';
  return 'pending';
}
