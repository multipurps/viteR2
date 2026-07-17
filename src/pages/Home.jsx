import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Row from '../components/Row';
import { getTrending, discover } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { getContinueWatching } from '../lib/supabase';

const GENRE_ROWS = [
  { title: 'Action & Thriller', params: 'with_genres=28,53', type: 'movie' },
  { title: 'Comedy', params: 'with_genres=35', type: 'movie' },
  { title: 'Sci-Fi & Fantasy', params: 'with_genres=878,14', type: 'movie' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [heroItems, setHeroItems] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [progressMap, setProgressMap] = useState({});
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
    })();
  }, []);

  useEffect(() => {
    if (!user) { setContinueWatching([]); return; }
    getContinueWatching(user.id).then((rows) => {
      const map = {};
      const items = rows.map((r) => {
        map[r.media_id] = r.progress ?? 0;
        return { ...r.media_data, id: Number(r.media_id), media_type: r.media_type };
      });
      setProgressMap(map);
      setContinueWatching(items);
    }).catch(() => setContinueWatching([]));
  }, [user]);

  return (
    <div>
      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/movie/${item.id}`)}
        onInfo={(item) => navigate(`/movie/${item.id}`)}
      />
      <div style={{ marginTop: 40 }}>
        {continueWatching.length > 0 && (
          <Row title="Continue Watching" items={continueWatching} progressMap={progressMap} />
        )}
        {rows.map((r) => (
          <Row key={r.title} title={r.title} items={r.items} />
        ))}
      </div>
    </div>
  );
}
