import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { createPairing, watchPairing, getPairingOnce, redeemPairing } from '../lib/supabase';
import './DesktopQrLogin.css';

const POLL_MS = 3000;

export default function DesktopQrLogin() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | approved | error
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    let stopWatching;
    let pollTimer;
    let cancelled = false;
    let handled = false;

    async function handleApproval(row) {
      if (handled || cancelled || !(row.status === 'approved' && row.token_hash)) return;
      handled = true;
      setStatus('approved');
      try {
        await redeemPairing(row.email, row.token_hash);
      } catch (e) {
        setError(e.message);
        setStatus('error');
      }
    }

    (async () => {
      try {
        const pairCode = await createPairing();
        setCode(pairCode);
        const url = `${window.location.origin}${window.location.pathname}#/pair/${pairCode}`;
        if (canvasRef.current) await QRCode.toCanvas(canvasRef.current, url, { width: 200, margin: 1 });
        if (cancelled) return;
        setStatus('ready');

        // Realtime is the fast path, but don't depend on it alone —
        // poll as a fallback in case Realtime isn't enabled on this table.
        stopWatching = watchPairing(pairCode, handleApproval);
        pollTimer = setInterval(async () => {
          if (handled) return;
          const row = await getPairingOnce(pairCode).catch(() => null);
          if (row) handleApproval(row);
        }, POLL_MS);
      } catch (e) {
        setError(e.message);
        setStatus('error');
      }
    })();

    return () => { cancelled = true; stopWatching?.(); clearInterval(pollTimer); };
  }, []);

  return (
    <div className="qr-login">
      <div className="qr-canvas-wrap">
        <canvas ref={canvasRef} />
        {status === 'approved' && <div className="qr-approved-overlay">Signed in — one sec…</div>}
      </div>
      {code && status !== 'approved' && <div className="qr-code-text">{code}</div>}
      <p className="qr-hint">
        {status === 'error'
          ? error
          : 'Scan the QR, or on your phone go to Profile → "Sign in a TV" and enter the code above'}
      </p>
    </div>
  );
}
