import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Hero from '../components/Hero';
import { discover, IMG, PROVIDERS } from '../lib/tmdb';
import './NetworkDetail.css';

const GENRE_CHIPS_MOVIE = [
  { label: 'All', genre: null },
  { label: 'Action', genre: 28 },
  { label: 'Comedy', genre: 35 },
  { label: 'Drama', genre: 18 },
  { label: 'Horror', genre: 27 },
  { label: 'Sci-Fi', genre: 878 },
  { label: 'Fantasy', genre: 14 },
  { label: 'Animation', genre: 16 },
  { label: 'Documentary', genre: 99 },
];

const GENRE_CHIPS_TV = [
  { label: 'All', genre: null },
  { label: 'Action', genre: 10759 },
  { label: 'Comedy', genre: 35 },
  { label: 'Drama', genre: 18 },
  { label: 'Crime', genre: 80 },
  { label: 'Sci-Fi', genre: 10765 },
  { label: 'Reality', genre: 10764 },
  { label: 'Animation', genre: 16 },
  { label: 'Documentary', genre: 99 },
];

export default function NetworkDetail() {
  const { key } = useParams();
  const navigate = useNavigate();
  const provider = PROVIDERS[key];
  const [mediaType, setMediaType] = useState('movie');
  const [genre, setGenre] = useState(null);
  const [heroItems, setHeroItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [gridItems, setGridItems] = useState([]);
  const chips = mediaType === 'movie' ? GENRE_CHIPS_MOVIE : GENRE_CHIPS_TV;

  useEffect(() => {
    if (!provider) return;
    (async () => {
      const data = await discover(mediaType, `watch_region=US&with_watch_providers=${provider.id}&sort_by=popularity.desc`);
      setHeroItems((data.results || []).filter((i) => i.backdrop_path).slice(0, 6));
    })();
  }, [provider, mediaType]);

  useEffect(() => {
    if (!provider) return;
    (async () => {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
      const dateField = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
      const data = await discover(mediaType, `watch_region=US&with_watch_providers=${provider.id}&${dateField}.gte=${cutoff}&sort_by=popularity.desc`);
      setNewItems(data.results || []);
    })();
  }, [provider, mediaType]);

  useEffect(() => {
    if (!provider) return;
    (async () => {
      const genreParam = genre ? `&with_genres=${genre}` : '';
      const data = await discover(mediaType, `watch_region=US&with_watch_providers=${provider.id}&sort_by=popularity.desc${genreParam}`);
      setGridItems(data.results || []);
    })();
  }, [provider, mediaType, genre]);

  if (!provider) {
    return <div className="network-missing">Unknown network. <button onClick={() => navigate('/networks')}>See all networks</button></div>;
  }

  return (
    <div className="network-page">
      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/${mediaType}/${item.id}`)}
        onInfo={(item) => navigate(`/${mediaType}/${item.id}`)}
      />

      <div className="network-body">
        <div className="network-type-toggle">
          <button className={mediaType === 'movie' ? 'active' : ''} onClick={() => { setMediaType('movie'); setGenre(null); }}>Movies</button>
          <button className={mediaType === 'tv' ? 'active' : ''} onClick={() => { setMediaType('tv'); setGenre(null); }}>Series</button>
        </div>

        <div className="network-chips">
          {chips.map((c) => (
            <button
              key={c.label}
              className={`network-chip${genre === c.genre ? ' active' : ''}`}
              onClick={() => setGenre(c.genre)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {newItems.length > 0 && (
          <section className="network-row">
            <h2>New</h2>
            <div className="network-row-track">
              {newItems.slice(0, 12).map((item) => (
                <PosterCard key={item.id} item={item} mediaType={mediaType} />
              ))}
            </div>
          </section>
        )}

        <section className="network-grid-section">
          <h2>{mediaType === 'movie' ? 'Movies' : 'Series'}</h2>
          <div className="network-grid">
            {gridItems.map((item) => (
              <PosterCard key={item.id} item={item} mediaType={mediaType} grid />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PosterCard({ item, mediaType, grid }) {
  const navigate = useNavigate();
  return (
    <button
      className={grid ? 'network-poster-grid' : 'network-poster-row'}
      onClick={() => navigate(`/${mediaType}/${item.id}`)}
    >
      <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
      <span className="network-poster-meta">
        <span>{(item.release_date || item.first_air_date || '').slice(0, 4)}</span>
        <span className="network-poster-rating">★ {item.vote_average?.toFixed(1)}</span>
      </span>
    </button>
  );
}
