import { useState } from 'react';
import { signInWithEmail } from '../lib/supabase';
import './EmailSignIn.css';

export default function EmailSignIn() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      await signInWithEmail(email.trim());
      setStatus('sent');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return <p className="email-signin-sent">Check {email} for a sign-in link.</p>;
  }

  return (
    <form className="email-signin" onSubmit={submit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        required
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? '…' : 'Email me a link'}
      </button>
      {status === 'error' && <p className="email-signin-error">{error}</p>}
    </form>
  );
}
