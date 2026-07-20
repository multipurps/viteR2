import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trendingOnProvider, IMG, PROVIDERS } from '../lib/tmdb';
import './Top10.css';

const TABS = Object.entries(PROVIDERS).map(([key, v]) => ({ key, ...v }));

export default function Top10() {
  const [active, setActive] = useState('netflix');
  const [items, setItems] = useState([]);
  const [mediaType, setMediaType] = useState('movie');

  useEffect(() => {
    (async () => {
      const { results } = await trendingOnProvider(active, mediaType, 'US', 10);
      setItems(results);
    })();
  }, [active, mediaType]);

  return (
    <div className="top10">
      <div className="top10-head">
        <h1>Top 10s</h1>
        <div className="top10-type-toggle">
          <button className={mediaType === 'movie' ? 'active' : ''} onClick={() => setMediaType('movie')}>Movies</button>
          <button className={mediaType === 'tv' ? 'active' : ''} onClick={() => setMediaType('tv')}>TV Shows</button>
        </div>
      </div>

      <p className="top10-disclaimer">
        Ranked by current popularity among titles available on each platform (via TMDB) —
        not each platform's official internal chart, which isn't publicly available anywhere.
      </p>

      <div className="top10-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`top10-tab${active === t.key ? ' active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="top10-list">
        {items.map((item, i) => (
          <Link
            key={item.id}
            to={`/${mediaType}/${item.id}`}
            className="top10-row"
          >
            <span className="top10-rank">{i + 1}</span>
            <img src={IMG(item.poster_path, 'w200')} alt={item.title || item.name} />
            <div className="top10-info">
              <span className="top10-title">{item.title || item.name}</span>
              <span className="top10-rating">★ {item.vote_average?.toFixed(1)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
