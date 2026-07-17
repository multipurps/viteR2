import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchMulti, IMG } from '../lib/tmdb';
import './Search.css';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="search-page">
      <div className="search-bar glass">
        <SearchIcon />
        <input
          autoFocus
          placeholder="Movies, series, shows…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="search-filter" aria-label="Filters"><FilterIcon /></button>
      </div>

      {loading && <p className="search-status">Searching…</p>}
      {!loading && query && results.length === 0 && <p className="search-status">Nothing found for “{query}”.</p>}

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
    </div>
  );
}

function SearchIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function FilterIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
