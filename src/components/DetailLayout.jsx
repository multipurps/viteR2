import { usePosterColor } from '../hooks/usePosterColor';
import { IMG } from '../lib/tmdb';
import SaveButton from './SaveButton';
import './DetailLayout.css';

export default function DetailLayout({ item, mediaType, tags, children }) {
  const posterUrl = IMG(item.poster_path, 'w342');
  const color = usePosterColor(posterUrl);
  const bg = color
    ? `linear-gradient(180deg, rgba(${color.r},${color.g},${color.b},0.9) 0%, var(--bg) 78%)`
    : undefined;
  const cast = (item.credits?.cast || []).slice(0, 8);

  return (
    <div className="detail2" style={{ background: bg }}>
      <div className="detail2-hero">
        <img className="detail2-poster" src={IMG(item.poster_path, 'w780')} alt={item.title || item.name} />
        <div className="detail2-hero-scrim" />
      </div>

      <div className="detail2-body">
        <span className="detail2-date">
          {(item.release_date || item.first_air_date || '').replace(/-/g, ' ')}
        </span>
        <h1 className="detail2-title">{item.title || item.name}</h1>

        <div className="detail2-tags">
          {tags.filter(Boolean).map((t) => (
            <span key={t} className="detail2-tag">{t}</span>
          ))}
        </div>

        <div className="detail2-stats">
          <span className="detail2-rating">★ {item.vote_average?.toFixed(1)}/10</span>
          <span className="detail2-votes">{formatCount(item.vote_count)} votes</span>
          <SaveButton mediaType={mediaType} mediaData={item} />
        </div>

        {cast.length > 0 && (
          <div className="detail2-section">
            <div className="detail2-section-head">
              <h2>Cast</h2>
            </div>
            <div className="detail2-cast-track">
              {cast.map((c) => (
                <div key={c.id} className="detail2-cast-card">
                  <img
                    src={c.profile_path ? IMG(c.profile_path, 'w185') : undefined}
                    alt={c.name}
                    className={c.profile_path ? '' : 'detail2-cast-placeholder'}
                  />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail2-section">
          <h2>Synopsis</h2>
          <p className="detail2-overview">{item.overview}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
