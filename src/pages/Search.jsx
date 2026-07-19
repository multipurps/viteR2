import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Hero from '../components/Hero';
import Row from '../components/Row';
import GenreChips from '../components/GenreChips';
import { searchMulti, getTrending, discover, IMG } from '../lib/tmdb';
import './Search.css';

export default function Search() {
  const navigate = useNavigate();
  const [urlParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeGenre, setActiveGenre] = useState(() => {
    const g = urlParams.get('genre');
    return g ? Number(g) : null;
  });
  const [heroItems, setHeroItems] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [movieItems, setMovieItems] = useState([]);

  // Browse feed (default state, before typing) — same blended
  // popular+trending+new-release approach as everywhere else.
  useEffect(() => {
    if (query.trim()) return;
    (async () => {
      const genreParam = activeGenre ? `&with_genres=${activeGenre}` : '';
      const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
      const [trending, popular, fresh] = await Promise.all([
        getTrending('movie', 'week'),
        discover('movie', `sort_by=popularity.desc${genreParam}`),
        discover('movie', `primary_release_date.gte=${cutoff}&sort_by=popularity.desc${genreParam}`),
      ]);
      const pool = [...(trending.results || []), ...(popular.results || []), ...(fresh.results || [])];
      const filtered = activeGenre ? pool.filter((m) => m.genre_ids?.includes(activeGenre)) : pool;
      const seen = new Set();
      const deduped = filtered.filter((m) => {
        if (!m.backdrop_path || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      setHeroItems(deduped.slice(0, 8));

      const trendingList = (trending.results || []).filter((m) => m.poster_path && m.genre_ids?.some((g) => !activeGenre || g === activeGenre));
      const trendingIds = new Set(trendingList.map((m) => m.id));

      const newList = (fresh.results || []).filter((m) => m.poster_path && !trendingIds.has(m.id));
      const newIds = new Set(newList.map((m) => m.id));
      // "Movies" is top-rated (not just popular), and excludes anything
      // already shown in "Trending"/"New" — genuinely different lists now.
      const topRated = await discover('movie', `sort_by=vote_average.desc&vote_count.gte=500${genreParam}`);
      const movieList = (topRated.results || []).filter((m) => m.poster_path && !newIds.has(m.id) && !trendingIds.has(m.id));

      setTrendingItems(trendingList);
      setNewItems(newList);
      setMovieItems(movieList);
    })();
  }, [activeGenre, query]);

  // Real search — takes over once you actually type something.
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      searchMulti(query)
        .then((data) => setResults((data.results || []).filter((r) => r.media_type !== 'person' && r.poster_path)))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const browsing = !query.trim();

  return (
    <div className="search-page">
      <div className="search-bar glass">
        <SearchIcon />
        <input
          placeholder="Movies, series, shows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-filter" aria-label="Filters"><FilterIcon /></button>
      </div>

      {browsing ? (
        <>
          <GenreChips active={activeGenre} onChange={setActiveGenre} />
          <Hero
            items={heroItems}
            onPlay={(item) => navigate(`/movie/${item.id}`)}
            onInfo={(item) => navigate(`/movie/${item.id}`)}
          />
          <div style={{ marginTop: 30 }}>
            <Row title="Trending" items={trendingItems} seeAllTo="/movies" />
            <Row title="New" items={newItems} seeAllTo="/movies" />
            <Row title="Movies" items={movieItems} seeAllTo="/movies" />
          </div>
        </>
      ) : (
        <>
          {loading && <p className="search-status">Searching…</p>}
          {!loading && results.length === 0 && <p className="search-status">Nothing found for “{query}”.</p>}
          <div className="search-grid">
            {results.map((item) => (
              <button
                key={`${item.media_type}-${item.id}`}
                className="search-card"
                onClick={() => navigate(`/${item.media_type}/${item.id}`)}
              >
                <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
                <span>{item.title || item.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SearchIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function FilterIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
