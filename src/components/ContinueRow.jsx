import { Link } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import './ContinueRow.css';

export default function ContinueRow({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="row">
      <h2 className="row-title">Continue Watching</h2>
      <div className="row-track">
        {items.map((item) => {
          const mt = item.media_type;
          const detailPath = `/${mt}/${item.id}`;
          const continuePath = item.season != null
            ? `${detailPath}?season=${item.season}&episode=${item.episode ?? 1}`
            : detailPath;
          return (
            <div key={`${mt}-${item.id}`} className="continue-card">
              <Link to={detailPath} className="continue-poster">
                <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
                {item.progress != null && (
                  <div className="row-progress">
                    <div className="row-progress-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </Link>
              <Link to={continuePath} className="continue-btn" aria-label="Continue">
                <PlayIcon />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4Z" /></svg>;
}
