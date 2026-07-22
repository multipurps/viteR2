import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getContinueWatching, getUserInteractions } from '../lib/supabase';
import { IMG } from '../lib/tmdb';
import './LeftBehind.css';

const STALE_DAYS = 5;

// No AI here on purpose — "abandoned but might be worth returning to"
// is just: started (progress > 5%), not finished (< 85%), hasn't been
// touched in a few days, and wasn't explicitly disliked. All of that
// already lives in zeeyus_continue + zeeyus_interactions.
export default function LeftBehind() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getContinueWatching(user.id, 40), getUserInteractions(user.id)])
      .then(([continueRows, interactions]) => {
        const negative = new Set(
          interactions
            .filter((i) => i.rating === 'dislike' || i.rating === 'not_interested')
            .map((i) => `${i.media_type}:${i.tmdb_id}`)
        );
        const staleCutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;

        const abandoned = continueRows
          .filter((c) => {
            const key = `${c.media_type}:${c.media_id}`;
            if (negative.has(key)) return false;
            if (!((c.progress || 0) > 0.05 && (c.progress || 0) < 0.85)) return false;
            if (new Date(c.updated_at).getTime() > staleCutoff) return false;
            return true;
          })
          .slice(0, 8);

        setItems(abandoned);
      })
      .catch(() => setItems([]));
  }, [user]);

  if (items.length === 0) return null;

  return (
    <div className="leftbehind-block">
      <h3>You Left These Behind</h3>
      <div className="leftbehind-track">
        {items.map((c) => (
          <button
            key={`${c.media_type}:${c.media_id}`}
            className="leftbehind-card"
            onClick={() => navigate(`/${c.media_type}/${c.media_id}`)}
          >
            <img src={IMG(c.media_data?.poster_path, 'w342')} alt={c.media_data?.title || c.media_data?.name} loading="lazy" />
            <div className="leftbehind-bar">
              <div style={{ width: `${Math.round((c.progress || 0) * 100)}%` }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
