import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, signOut } from '../lib/supabase';
import { getTrending, getPrimaryProviderId, PROVIDERS, IMG } from '../lib/tmdb';
import { usePosterColor } from '../hooks/usePosterColor';
import DesktopQrLogin from './DesktopQrLogin';
import './AuthGate.css';

const PROVIDER_LABEL_BY_ID = Object.fromEntries(
  Object.values(PROVIDERS).map((p) => [p.id, p.label])
);

function useTitleCarousel() {
  const [titles, setTitles] = useState([]);
  const [networks, setNetworks] = useState({}); // { movieId: 'Netflix' }
  const [index, setIndex] = useState(0);

  useEffect(() => {
    getTrending('movie', 'day').then(async (data) => {
      const list = (data.results || []).filter((p) => p.backdrop_path).slice(0, 10);
      setTitles(list);

      // Preload every backdrop up front so rotating to the next one
      // never shows a blank/loading flash.
      list.forEach((t) => { const img = new Image(); img.src = IMG(t.backdrop_path, 'original'); });

      // Resolve which network each title streams on, for display.
      const entries = await Promise.all(
        list.map(async (t) => {
          const providerId = await getPrimaryProviderId('movie', t.id).catch(() => null);
          return [t.id, providerId ? PROVIDER_LABEL_BY_ID[providerId] : null];
        })
      );
      setNetworks(Object.fromEntries(entries));
    });
  }, []);

  useEffect(() => {
    if (titles.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % titles.length), 10000);
    return () => clearInterval(t);
  }, [titles.length]);

  const active = titles[index];
  return { active, network: active ? networks[active.id] : null };
}

export default function AuthGate({ children }) {
  const { loading, status, user, refreshProfile } = useAuth();
  // Desktop/TV: skip the tap-to-advance splash — a remote makes that
  // step annoying, and the QR/TV-code needs to be visible immediately.
  const isWide = typeof window !== 'undefined' && window.innerWidth >= 861;
  const [step, setStep] = useState(isWide ? 'signin' : 'splash'); // splash | signin
  const { active, network } = useTitleCarousel();
  const color = usePosterColor(active ? IMG(active.poster_path, 'w342') : null);
  const glow = color ? `rgba(${color.r},${color.g},${color.b},0.55)` : 'rgba(124,58,237,0.4)';

  if (loading) return <div className="gate-screen"><div className="gate-loading" /></div>;

  if (status === 'signed-out') {
    if (step === 'splash') {
      return (
        <div className="splash-screen">
          {active && (
            <img key={active.id} src={IMG(active.backdrop_path, 'original')} alt="" className="splash-bg" />
          )}
          <div className="splash-scrim" />
          <div className="splash-content">
            <div className="splash-mark">Z</div>
            {active && <h1 className="splash-title">{active.title || active.name}</h1>}
            {network && <span className="splash-network">{network}</span>}
            <button className="splash-getstarted" onClick={() => setStep('signin')}>Get Started</button>
          </div>
        </div>
      );
    }

    return (
      <div className="gate-screen" style={{ background: `radial-gradient(ellipse at 50% 20%, ${glow} 0%, transparent 60%), var(--bg)` }}>
        {active && <img src={IMG(active.backdrop_path, 'original')} alt="" className="gate-bg" />}
        <div className="gate-bg-scrim" />
        <div className="gate-bare">
          <div className="gate-mark">Z</div>
          <button className="gate-google-btn" onClick={() => signInWithGoogle()}>
            <GoogleIcon /> Continue with Google
          </button>
          <DesktopQrLogin />
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="gate-screen">
        <div className="gate-box glass-strong">
          <div className="gate-mark">Z</div>
          <h1>Awaiting approval</h1>
          <p>Signed in as {user.email}. This account needs approval before it can watch anything.</p>
          <div className="gate-actions">
            <button className="gate-refresh" onClick={refreshProfile}>Check again</button>
            <button className="gate-signout" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'blocked') {
    return (
      <div className="gate-screen">
        <div className="gate-box glass-strong">
          <div className="gate-mark">Z</div>
          <h1>Access blocked</h1>
          <p>This account doesn't have access.</p>
          <button className="gate-signout" onClick={() => signOut()}>Sign out</button>
        </div>
      </div>
    );
  }

  return children;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
