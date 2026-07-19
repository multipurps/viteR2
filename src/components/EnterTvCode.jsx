import { useState } from 'react';
import { approvePairing } from '../lib/supabase';
import './EnterTvCode.css';

export default function EnterTvCode() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (code.trim().length < 4) return;
    setStatus('loading');
    setError('');
    try {
      await approvePairing(code.trim().toUpperCase());
      setStatus('done');
      setCode('');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setError(err.message || 'Could not sign in that device — check the code and try again.');
      setStatus('error');
    }
  }

  return (
    <form className="tvcode-form glass" onSubmit={submit}>
      <h3>Sign in a TV</h3>
      <p>Enter the code shown on your TV screen.</p>
      <div className="tvcode-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
          autoCapitalize="characters"
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : 'Confirm'}
        </button>
      </div>
      {status === 'done' && <p className="tvcode-success">TV signed in.</p>}
      {status === 'error' && <p className="tvcode-error">{error}</p>}
    </form>
  );
}
