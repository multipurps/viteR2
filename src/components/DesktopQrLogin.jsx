import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { createPairing, watchPairing, redeemPairing } from '../lib/supabase';
import './DesktopQrLogin.css';

export default function DesktopQrLogin() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | approved | error
  const [error, setError] = useState('');

  useEffect(() => {
    let stopWatching;
    let cancelled = false;

    (async () => {
      try {
        const code = await createPairing();
        const url = `${window.location.origin}/pair/${code}`;
        if (canvasRef.current) await QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 1 });
        if (cancelled) return;
        setStatus('ready');

        stopWatching = watchPairing(code, async (row) => {
          if (row.status === 'approved' && row.token_hash) {
            setStatus('approved');
            try {
              await redeemPairing(row.email, row.token_hash);
              // onAuthStateChange in AuthContext picks up the new session automatically
            } catch (e) {
              setError(e.message);
              setStatus('error');
            }
          }
        });
      } catch (e) {
        setError(e.message);
        setStatus('error');
      }
    })();

    return () => { cancelled = true; stopWatching?.(); };
  }, []);

  return (
    <div className="qr-login">
      <div className="qr-canvas-wrap">
        <canvas ref={canvasRef} />
        {status === 'approved' && <div className="qr-approved-overlay">Signed in — one sec…</div>}
      </div>
      <p className="qr-hint">
        {status === 'error'
          ? error
          : 'Scan with a phone that\'s already signed in to Zeeyus'}
      </p>
    </div>
  );
}
