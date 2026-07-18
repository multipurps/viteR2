import { Link } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import './FeaturedRow.css';

export default function FeaturedRow({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="featured-row">
      <h2 className="featured-title">Featured</h2>
      <div className="featured-track">
        {items.map((item) => {
          const mt = item.media_type === 'tv' ? 'tv' : 'movie';
          return (
            <Link key={item.id} to={`/${mt}/${item.id}`} className="featured-card">
              <img src={IMG(item.backdrop_path, 'w780')} alt={item.title || item.name} loading="lazy" />
              <div className="featured-scrim" />
              <span className="featured-card-title">{item.title || item.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
