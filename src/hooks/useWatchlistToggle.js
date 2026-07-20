import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../lib/supabase';

export function useWatchlistToggle(mediaType, mediaData) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !mediaData?.id) return;
    isInWatchlist(user.id, mediaData.id, mediaType).then(setSaved).catch(() => {});
  }, [user, mediaData?.id, mediaType]);

  async function toggle() {
    if (!user || busy || !mediaData?.id) return;
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

  return { saved, busy, toggle };
}
