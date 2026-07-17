import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Row from '../components/Row';
import ContinueRow from '../components/ContinueRow';
import NetworkRow from '../components/NetworkRow';
import GenreChips from '../components/GenreChips';
import TopBar from '../components/TopBar';
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
  const [activeGenre, setActiveGenre] = useState(null);
  const [heroItems, setHeroItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [rows, setRows] = useState([]);

  // Hero pulls from a blend of popular + trending + new-release, not a
  // fixed list — so it stays current as new titles come out. When a
  // genre chip is active, all three sources get filtered by it too.
  useEffect(() => {
    (async () => {
      const genreParam = activeGenre ? `&with_genres=${activeGenre}` : '';
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);

      const [trending, popular, fresh] = await Promise.all([
        getTrending('movie', 'week'),
        discover('movie', `sort_by=popularity.desc${genreParam}`),
        discover('movie', `primary_release_date.gte=${cutoff}&sort_by=popularity.desc${genreParam}`),
      ]);

      const pool = [...(trending.results || []), ...(popular.results || []), ...(fresh.results || [])];
      const filteredPool = activeGenre
        ? pool.filter((m) => m.genre_ids?.includes(activeGenre))
        : pool;
      const seen = new Set();
      const deduped = filteredPool.filter((m) => {
        if (!m.backdrop_path || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setHeroItems(deduped.slice(0, 8));
      setNewItems((fresh.results || []).filter((m) => m.poster_path));
    })();
  }, [activeGenre]);

  useEffect(() => {
    if (activeGenre) { setRows([]); return; }
    (async () => {
      const genreRows = await Promise.all(
        GENRE_ROWS.map(async (g) => ({
          title: g.title,
          items: (await discover(g.type, g.params)).results || [],
        }))
      );
      setRows(genreRows);
    })();
  }, [activeGenre]);

  useEffect(() => {
    if (!user) { setContinueWatching([]); return; }
    getContinueWatching(user.id).then((rows) => {
      const items = rows.map((r) => ({
        ...r.media_data,
        id: Number(r.media_id),
        media_type: r.media_type,
        progress: r.progress ?? 0,
        season: r.season,
        episode: r.episode,
      }));
      setContinueWatching(items);
    }).catch(() => setContinueWatching([]));
  }, [user]);

  return (
    <div>
      <TopBar />
      <div className="home-chips-mobile">
        <GenreChips active={activeGenre} onChange={setActiveGenre} />
      </div>

      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/movie/${item.id}`)}
        onInfo={(item) => navigate(`/movie/${item.id}`)}
      />

      <div style={{ marginTop: 40 }}>
        <NetworkRow />
        {continueWatching.length > 0 && <ContinueRow items={continueWatching} />}
        <Row title="New" items={newItems} seeAllTo="/movies" />
        {rows.map((r) => (
          <Row key={r.title} title={r.title} items={r.items} seeAllTo="/movies" />
        ))}
      </div>
    </div>
  );
}
