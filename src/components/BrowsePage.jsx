import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from './Hero';
import CategoryRows from './CategoryRows';
import { resolveCategory } from '../lib/tmdb';

export default function BrowsePage({ mediaType, categories, heroSource }) {
  const navigate = useNavigate();
  const [heroItems, setHeroItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const heroResults = await resolveCategory(heroSource, mediaType);
      if (!cancelled) setHeroItems(heroResults.filter((i) => i.backdrop_path).slice(0, 6));
    })();
    return () => { cancelled = true; };
  }, [mediaType, heroSource]);

  return (
    <div>
      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/${mediaType}/${item.id}`)}
        onInfo={(item) => navigate(`/${mediaType}/${item.id}`)}
      />
      <div style={{ marginTop: 40 }}>
        <CategoryRows mediaType={mediaType} categories={categories} />
      </div>
    </div>
  );
}
