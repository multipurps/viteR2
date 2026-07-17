import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWatchlist, removeFromWatchlist } from '../lib/supabase';
import { IMG } from '../lib/tmdb';
import { Link } from 'react-router-dom';
import './Watchlist.css';

export default function Watchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);

  useEffect(() => {
    if (!user) return;
    getWatchlist(user.id).then(setItems).catch(() => setItems([]));
  }, [user]);

  async function handleRemove(item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await removeFromWatchlist(user.id, item.media_id, item.media_type);
    } catch {
      // put it back if the delete failed
      setItems((prev) => [item, ...prev]);
    }
  }

  return (
    <div className="watchlist-page">
      <h1>Watchlist</h1>

      {items === null && <p className="watchlist-empty">Loading…</p>}
      {items?.length === 0 && (
        <p className="watchlist-empty">Nothing saved yet — hit the bookmark icon on any title to add it here.</p>
      )}

      <div className="watchlist-grid">
        {items?.map((item) => {
          const media = item.media_data || {};
          return (
            <div key={item.id} className="watchlist-card">
              <Link to={`/${item.media_type}/${item.media_id}`}>
                <img src={IMG(media.poster_path, 'w342')} alt={media.title || media.name} />
              </Link>
              <button className="watchlist-remove" onClick={() => handleRemove(item)} aria-label="Remove">✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
