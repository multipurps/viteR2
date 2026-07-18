import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../lib/supabase';
import './SaveButton.css';

export default function SaveButton({ mediaType, mediaData }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !mediaData?.id) return;
    isInWatchlist(user.id, mediaData.id, mediaType).then(setSaved).catch(() => {});
  }, [user, mediaData?.id, mediaType]);

  async function toggle() {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (saved) {
        await removeFromWatchlist(user.id, mediaData.id, mediaType);
        setSaved(false);
      } else {
        await addToWatchlist(user.id, mediaType, mediaData);
        setSaved(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={`save-btn glass${saved ? ' saved' : ''}`} onClick={toggle} disabled={busy} aria-label="Save to watchlist">
      <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'}>
        <path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
