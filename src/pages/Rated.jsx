import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRatedTitles, backfillInteractionSnapshot } from '../lib/supabase';
import { getDetails, IMG } from '../lib/tmdb';
import './Rated.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'love', label: 'Loved' },
  { key: 'like', label: 'Liked' },
  { key: 'dislike', label: 'Disliked' },
];

const BADGE = {
  love: { label: 'Loved', className: 'rated-badge-love' },
  like: { label: 'Liked', className: 'rated-badge-like' },
  dislike: { label: 'Disliked', className: 'rated-badge-dislike' },
  not_interested: { label: 'Not for me', className: 'rated-badge-meh' },
};

export default function Rated() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [active, setActive] = useState('all');

  useEffect(() => {
    if (!user) return;
    getRatedTitles(user.id).then(async (rows) => {
      setItems(rows);

      // Rated before media_data existed — fetch once from TMDB, show
      // it immediately, and persist so this only happens once per title.
      const missing = rows.filter((r) => !r.media_data);
      for (const row of missing) {
        try {
          const details = await getDetails(row.media_type, row.tmdb_id);
          setItems((prev) => prev.map((p) => (
            p.tmdb_id === row.tmdb_id && p.media_type === row.media_type
              ? { ...p, media_data: details }
              : p
          )));
          backfillInteractionSnapshot(user.id, row.tmdb_id, row.media_type, details).catch(() => {});
        } catch {
          // Title may have been removed from TMDB — leave it out of view rather than showing a broken card.
        }
      }
    }).catch(() => setItems([]));
  }, [user]);

  const filtered = (items || []).filter((i) => active === 'all' || i.rating === active);

  return (
    <div className="rated-page">
      <h1>Watched &amp; Rated</h1>
      <p className="rated-sub">Every title you've rated — rating something here marks it watched and sharpens your recommendations.</p>

      <div className="rated-chips">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`rated-chip${active === f.key ? ' active' : ''}`}
            onClick={() => setActive(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items === null && <p className="rated-empty">Loading…</p>}
      {items?.length === 0 && (
        <p className="rated-empty">Nothing rated yet — rate a title from its page (Love / Like / Dislike) and it'll show up here.</p>
      )}
      {items?.length > 0 && filtered.length === 0 && (
        <p className="rated-empty">Nothing in this category yet.</p>
      )}

      <div className="rated-grid">
        {filtered.map((item) => {
          const media = item.media_data || {};
          const title = media.title || media.name || 'Untitled';
          const year = (media.release_date || media.first_air_date || '').slice(0, 4);
          const badge = BADGE[item.rating] || BADGE.like;
          return (
            <button
              key={`${item.media_type}:${item.tmdb_id}`}
              className="rated-card"
              onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}
            >
              <img src={IMG(media.poster_path, 'w342')} alt={title} loading="lazy" />
              <span className={`rated-badge ${badge.className}`}>{badge.label}</span>
              <div className="rated-card-info">
                <span className="rated-card-title">{title}</span>
                {year && <span className="rated-card-year">{year}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
