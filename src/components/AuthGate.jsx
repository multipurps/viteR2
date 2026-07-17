import { useAuth } from '../context/AuthContext';
import { signInWithGoogle, signOut } from '../lib/supabase';
import './AuthGate.css';

export default function AuthGate({ children }) {
  const { loading, status, user, refreshProfile } = useAuth();

  if (loading) return <div className="gate-screen"><div className="gate-loading" /></div>;

  if (status === 'signed-out') {
    return (
      <div className="gate-screen">
        <div className="gate-box glass-strong">
          <div className="gate-mark">Z</div>
          <h1>Zeeyus</h1>
          <p>Sign in to continue.</p>
          <button className="gate-google-btn" onClick={() => signInWithGoogle()}>
            <GoogleIcon /> Continue with Google
          </button>
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
