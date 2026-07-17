import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from './Hero';
import Row from './Row';
import { resolveCategory } from '../lib/tmdb';

export default function BrowsePage({ mediaType, categories, heroSource }) {
  const navigate = useNavigate();
  const [heroItems, setHeroItems] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const heroResults = await resolveCategory(heroSource, mediaType);
      if (!cancelled) setHeroItems(heroResults.filter((i) => i.backdrop_path).slice(0, 6));
    })();

    // Load rows progressively so the page renders as each category
    // resolves, instead of waiting on all ~15 requests to finish.
    categories.forEach((cat) => {
      resolveCategory(cat, mediaType)
        .then((items) => {
          if (cancelled) return;
          setRows((prev) => {
            const next = prev.filter((r) => r.title !== cat.title);
            next.push({ title: cat.title, items });
            const order = categories.map((c) => c.title);
            return next.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
          });
        })
        .catch(() => {});
    });

    return () => { cancelled = true; };
  }, [mediaType, categories, heroSource]);

  return (
    <div>
      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/${mediaType}/${item.id}`)}
        onInfo={(item) => navigate(`/${mediaType}/${item.id}`)}
      />
      <div style={{ marginTop: 40 }}>
        {rows.map((r) => (
          <Row key={r.title} title={r.title} items={r.items} type={mediaType} />
        ))}
      </div>
    </div>
  );
}
