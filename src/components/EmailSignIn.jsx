import { useState } from 'react';
import { signInWithPassword, signUpWithPassword } from '../lib/supabase';
import './EmailSignIn.css';

export default function EmailSignIn() {
  const [tab, setTab] = useState('in'); // in | up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | pending | error
  const [error, setError] = useState('');

  function switchTab(t) {
    setTab(t);
    setStatus('idle');
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) { setError('Please fill both fields.'); return; }
    if (tab === 'up' && password.length < 8) { setError('Password must be 8+ chars.'); return; }

    setStatus('loading');
    setError('');
    try {
      if (tab === 'in') {
        const { error: err } = await signInWithPassword(trimmedEmail, password);
        if (err) throw err;
        // On success, onAuthStateChange picks up the session and AuthGate
        // moves on automatically (to "pending" or into the app).
      } else {
        const { error: err } = await signUpWithPassword(trimmedEmail, password);
        if (err) throw err;
        setStatus('pending');
        return;
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
      return;
    }
    setStatus('idle');
  }

  if (status === 'pending') {
    return <p className="email-signin-sent">Request submitted — you'll get access once approved.</p>;
  }

  return (
    <div className="email-signin-wrap">
      <div className="email-signin-tabs">
        <button type="button" className={`email-signin-tab${tab === 'in' ? ' active' : ''}`} onClick={() => switchTab('in')}>
          Sign In
        </button>
        <button type="button" className={`email-signin-tab${tab === 'up' ? ' active' : ''}`} onClick={() => switchTab('up')}>
          Request Access
        </button>
      </div>
      <form className="email-signin" onSubmit={submit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={tab === 'up' ? 'Password (8+ chars)' : 'Password'}
          autoComplete={tab === 'up' ? 'new-password' : 'current-password'}
          required
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : tab === 'in' ? 'Sign In' : 'Request Access'}
        </button>
      </form>
      {status === 'error' && <p className="email-signin-error">{error}</p>}
    </div>
  );
}
