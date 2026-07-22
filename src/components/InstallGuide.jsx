import { useState } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import './InstallGuide.css';

const STEPS = {
  'ios-safari': {
    label: 'Safari',
    steps: [
      <>Tap the <b>Share</b> icon <ShareIcon /> in the toolbar</>,
      <>Scroll down and tap <b>Add to Home Screen</b></>,
      <>Tap <b>Add</b> in the top right</>,
    ],
  },
  'ios-chrome': {
    label: 'Chrome',
    steps: [
      <>iOS only allows installing from <b>Safari</b> — tap <b>⋯</b> at the bottom, then <b>Open in Safari</b></>,
      <>Tap the <b>Share</b> icon <ShareIcon /> in the toolbar</>,
      <>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b></>,
    ],
  },
  'ios-firefox': {
    label: 'Firefox',
    steps: [
      <>iOS only allows installing from <b>Safari</b> — tap <b>⋯</b>, then <b>Open in Safari</b></>,
      <>Tap the <b>Share</b> icon <ShareIcon /> in the toolbar</>,
      <>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b></>,
    ],
  },
  'android-chrome': {
    label: 'Chrome',
    steps: [
      <>Tap the <b>⋮</b> menu in the top right</>,
      <>Tap <b>Install app</b> (or <b>Add to Home screen</b>)</>,
      <>Confirm by tapping <b>Install</b></>,
    ],
  },
  'android-samsung': {
    label: 'Samsung Internet',
    steps: [
      <>Tap the <b>⋮</b> menu at the bottom</>,
      <>Tap <b>Add page to</b> → <b>Home screen</b></>,
      <>Confirm by tapping <b>Add</b></>,
    ],
  },
  'android-firefox': {
    label: 'Firefox',
    steps: [
      <>Tap the <b>⋮</b> menu in the top right</>,
      <>Tap <b>Install</b></>,
      <>Confirm by tapping <b>Add</b></>,
    ],
  },
  'android-other': {
    label: 'your browser',
    steps: [
      <>Open the browser menu</>,
      <>Look for <b>Add to Home screen</b> or <b>Install app</b></>,
      <>Confirm to finish</>,
    ],
  },
};

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: '-2px', margin: '0 2px' }}>
      <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// variant: 'card' — Profile-style link row. 'banner' — compact strip for the sign-in screen.
export default function InstallGuide({ variant = 'card' }) {
  const { platform, installed, isMobile, canNativePrompt, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('installGuideDismissed') === '1');

  if (!isMobile || installed || platform === 'other') return null;
  if (variant === 'banner' && dismissed) return null;

  const config = STEPS[platform];

  async function handleTap() {
    if (canNativePrompt) {
      await promptInstall();
      return;
    }
    setOpen(true);
  }

  function dismissBanner() {
    localStorage.setItem('installGuideDismissed', '1');
    setDismissed(true);
  }

  return (
    <>
      {variant === 'card' ? (
        <button className="install-link-card glass" onClick={handleTap}>
          <span>Add to Home Screen</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      ) : (
        <div className="install-banner glass">
          <span>Install the app for the full experience</span>
          <div className="install-banner-actions">
            <button className="install-banner-btn" onClick={handleTap}>Install</button>
            <button className="install-banner-dismiss" onClick={dismissBanner} aria-label="Dismiss">✕</button>
          </div>
        </div>
      )}

      {open && (
        <div className="install-modal-scrim" onClick={() => setOpen(false)}>
          <div className="install-modal glass-strong" onClick={(e) => e.stopPropagation()}>
            <h2>Add to Home Screen</h2>
            <p className="install-modal-sub">Using {config.label}</p>
            <ol className="install-steps">
              {config.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
            <button className="install-modal-close" onClick={() => setOpen(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
