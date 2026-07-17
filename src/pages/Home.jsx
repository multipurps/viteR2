import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Row from '../components/Row';
import { getTrending, getPopular, discover } from '../lib/tmdb';

const GENRE_ROWS = [
  { title: 'Action & Thriller', params: 'with_genres=28,53', type: 'movie' },
  { title: 'Comedy', params: 'with_genres=35', type: 'movie' },
  { title: 'Sci-Fi & Fantasy', params: 'with_genres=878,14', type: 'movie' },
];

export default function Home() {
  const navigate = useNavigate();
  const [heroItems, setHeroItems] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const trending = await getTrending('movie', 'week');
      setHeroItems((trending.results || []).slice(0, 6));

      const genreRows = await Promise.all(
        GENRE_ROWS.map(async (g) => ({
          title: g.title,
          items: (await discover(g.type, g.params)).results || [],
        }))
      );
      setRows(genreRows);

      // Continue-watching: reads from localStorage for now (per-device).
      // Once Supabase auth is wired in, this swaps to a `watch_progress`
      // table keyed by user id so it syncs across devices.
      const saved = JSON.parse(localStorage.getItem('zeeyus_continue') || '[]');
      setContinueWatching(saved);
    })();
  }, []);

  return (
    <div>
      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/movie/${item.id}`)}
        onInfo={(item) => navigate(`/movie/${item.id}`)}
      />
      <div style={{ marginTop: 40 }}>
        {continueWatching.length > 0 && (
          <Row title="Continue Watching" items={continueWatching} />
        )}
        {rows.map((r) => (
          <Row key={r.title} title={r.title} items={r.items} />
        ))}
      </div>
    </div>
  );
}
