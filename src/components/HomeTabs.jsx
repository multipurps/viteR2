import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from './Hero';
import CategoryRows from './CategoryRows';
import { getTrending } from '../lib/tmdb';
import { MOVIE_CATEGORIES, TV_CATEGORIES } from '../lib/categories';
import './HomeTabs.css';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV Shows' },
];

export default function HomeTabs() {
  const [tab, setTab] = useState('home');
  const [heroItems, setHeroItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (tab === 'home') {
        const [tm, tt] = await Promise.all([getTrending('movie', 'day'), getTrending('tv', 'day')]);
        const pool = [
          ...(tm.results || []).map((m) => ({ ...m, media_type: 'movie' })),
          ...(tt.results || []).map((t) => ({ ...t, media_type: 'tv' })),
        ].filter((m) => m.backdrop_path);
        setHeroItems(pool.slice(0, 6));
      } else {
        const data = await getTrending(tab, 'day');
        setHeroItems((data.results || []).filter((m) => m.backdrop_path).map((m) => ({ ...m, media_type: tab })).slice(0, 6));
      }
    })();
  }, [tab]);

  const categories = tab === 'tv' ? TV_CATEGORIES : MOVIE_CATEGORIES;
  const categoryMediaType = tab === 'tv' ? 'tv' : 'movie';

  return (
    <section className="hometabs">
      <div className="hometabs-switch glass">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/${item.media_type}/${item.id}`)}
        onInfo={(item) => navigate(`/${item.media_type}/${item.id}`)}
      />

      <div style={{ marginTop: 30 }}>
        <CategoryRows mediaType={categoryMediaType} categories={categories} />
      </div>
    </section>
  );
}
