import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { approvePairing } from '../lib/supabase';
import './PairConfirm.css';

export default function PairConfirm() {
  const { code } = useParams();
  const [status, setStatus] = useState('idle'); // idle | approving | done | error
  const [error, setError] = useState('');

  async function handleApprove() {
    setStatus('approving');
    try {
      await approvePairing(code);
      setStatus('done');
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }

  return (
    <div className="pair-page">
      <div className="pair-box glass-strong">
        {status === 'done' ? (
          <>
            <h1>Signed in</h1>
            <p>That device is now signed in. You can close this tab.</p>
          </>
        ) : (
          <>
            <h1>Sign in on another device?</h1>
            <p>Confirm to sign that device into your Zeeyus account.</p>
            {status === 'error' && <p className="pair-error">{error}</p>}
            <button className="pair-confirm-btn" onClick={handleApprove} disabled={status === 'approving'}>
              {status === 'approving' ? 'Confirming…' : 'Confirm sign-in'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
