import { Link } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import ScrollRow from './ScrollRow';
import './ContinueRow.css';

export default function ContinueRow({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="row">
      <div className="row-head">
        <h2 className="row-title">Continue Watching</h2>
      </div>
      <ScrollRow className="row-track">
        {items.map((item) => {
          const mt = item.media_type;
          const title = item.title || item.name;
          const detailPath = `/${mt}/${item.id}`;
          const continuePath = item.season != null
            ? `${detailPath}?season=${item.season}&episode=${item.episode ?? 1}`
            : detailPath;
          const episodeLabel = mt === 'tv' && item.season != null
            ? `S${item.season} · E${item.episode ?? 1}`
            : null;

          return (
            <div key={`${mt}-${item.id}`} className="continue-card">
              <Link to={detailPath} className="continue-poster">
                <img src={IMG(item.poster_path, 'w342')} alt={title} loading="lazy" />
                {item.progress != null && (
                  <div className="row-progress">
                    <div className="row-progress-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </Link>
              <Link to={continuePath} className="continue-btn" aria-label="Continue">
                <PlayIcon />
              </Link>
              <div className="continue-info">
                <span className="continue-title">{title}</span>
                {episodeLabel && <span className="continue-episode">{episodeLabel}</span>}
              </div>
            </div>
          );
        })}
      </ScrollRow>
    </section>
  );
}

function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4Z" /></svg>;
}
