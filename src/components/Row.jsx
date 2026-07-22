import { Link } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import ScrollRow from './ScrollRow';
import './Row.css';

export default function Row({ title, items = [], type = 'movie', seeAllTo }) {
  if (!items.length) return null;
  return (
    <section className="row">
      <div className="row-head">
        <h2 className="row-title">{title}</h2>
        {seeAllTo && <Link to={seeAllTo} className="row-seeall">See all</Link>}
      </div>
      <ScrollRow className="row-track">
        {items.map((item) => {
          const mt = item.media_type || type;
          return (
            <Link key={item.id} to={`/${mt === 'tv' ? 'tv' : 'movie'}/${item.id}`} className="row-card">
              <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
            </Link>
          );
        })}
      </ScrollRow>
    </section>
  );
}
