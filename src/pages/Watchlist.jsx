import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWatchlist, removeFromWatchlist } from '../lib/supabase';
import { IMG, getNetworkList, getPrimaryProviderId, PROVIDERS } from '../lib/tmdb';
import ScrollRow from '../components/ScrollRow';
import './Watchlist.css';

export default function Watchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [active, setActive] = useState('all');
  const navigate = useNavigate();

  const knownIds = new Set(Object.values(PROVIDERS).map((p) => p.id));

  useEffect(() => {
    // Favourites chips stay to the curated major platforms (matching the
    // reference design) rather than the full ~150-provider Networks list.
    getNetworkList().then((list) => setNetworks(list.filter((n) => knownIds.has(n.id))));
  }, []);

  useEffect(() => {
    if (!user) return;
    getWatchlist(user.id).then(async (rows) => {
      const withProvider = await Promise.all(
        rows.map(async (r) => ({
          ...r,
          _providerId: await getPrimaryProviderId(r.media_type, r.media_id).catch(() => null),
        }))
      );
      setItems(withProvider);
    }).catch(() => setItems([]));
  }, [user]);

  async function handleRemove(item) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    try {
      await removeFromWatchlist(user.id, item.media_id, item.media_type);
    } catch {
      setItems((prev) => [item, ...prev]);
    }
  }

  const availableProviderIds = new Set((items || []).map((i) => i._providerId).filter(Boolean));
  const visibleNetworks = networks.filter((n) => availableProviderIds.has(n.id));
  const filtered = (items || []).filter((i) => active === 'all' || i._providerId === active);

  return (
    <div className="fav-page">
      <h1>Favourites</h1>

      {visibleNetworks.length > 0 && (
        <div className="fav-chips">
          <button className={`fav-chip${active === 'all' ? ' active' : ''}`} onClick={() => setActive('all')}>All</button>
          {visibleNetworks.map((n) => (
            <button
              key={n.id}
              className={`fav-chip fav-chip-logo${active === n.id ? ' active' : ''}`}
              onClick={() => setActive(n.id)}
            >
              <img src={n.logo} alt={n.name} />
            </button>
          ))}
        </div>
      )}

      {items === null && <p className="fav-empty">Loading…</p>}
      {items?.length === 0 && (
        <p className="fav-empty">Nothing saved yet — hit the bookmark icon on any title to add it here.</p>
      )}
      {items?.length > 0 && filtered.length === 0 && (
        <p className="fav-empty">Nothing saved from this network.</p>
      )}

      <ScrollRow className="fav-carousel">
        {filtered.map((item) => {
          const media = item.media_data || {};
          const title = media.title || media.name;
          const year = (media.release_date || media.first_air_date || '').slice(0, 4);
          const runtime = media.runtime ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m` : null;
          return (
            <div key={item.id} className="fav-card">
              <img
                src={IMG(media.poster_path, 'w780')}
                alt={title}
                onClick={() => navigate(`/${item.media_type}/${item.media_id}`)}
              />
              <div className="fav-card-scrim" />
              <button className="fav-remove" onClick={() => handleRemove(item)} aria-label="Remove">✕</button>
              <div className="fav-card-info">
                <h3>{title}</h3>
                <div className="fav-card-meta">
                  {year && <span>{year}</span>}
                  {runtime && <><span className="fav-dot" /><span>{runtime}</span></>}
                  <span className="fav-dot" />
                  <span className="fav-rating">★ {media.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </ScrollRow>
    </div>
  );
}
