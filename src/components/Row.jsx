import { Link } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import './Row.css';

export default function Row({ title, items = [], type = 'movie', progressMap }) {
  if (!items.length) return null;
  return (
    <section className="row">
      <h2 className="row-title">{title}</h2>
      <div className="row-track">
        {items.map((item) => {
          const mt = item.media_type || type;
          const progress = progressMap?.[item.id];
          return (
            <Link key={item.id} to={`/${mt === 'tv' ? 'tv' : 'movie'}/${item.id}`} className="row-card">
              <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
              {progress != null && (
                <div className="row-progress">
                  <div className="row-progress-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
