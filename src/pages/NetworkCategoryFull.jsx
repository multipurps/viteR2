import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { discover, getNetworkList, IMG } from '../lib/tmdb';
import './CategoryFull.css';

// Same grid + load-more pattern as CategoryFull.jsx, but for a
// network+genre combo (dynamic — not one of the static category
// lists, since it depends on a provider id that only exists at
// runtime), reached via each genre row's "See all" on a network page.
export default function NetworkCategoryFull() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mediaType = searchParams.get('type') || 'movie';
  const label = searchParams.get('label') || 'Titles';
  const genre = searchParams.get('genre');
  const keyword = searchParams.get('keyword');
  const filterParam = keyword ? `with_keywords=${keyword}` : `with_genres=${genre}`;

  const [provider, setProvider] = useState(undefined); // undefined = loading, null = not found
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNetworkList().then((list) => setProvider(list.find((p) => p.id === Number(id)) || null));
  }, [id]);

  useEffect(() => {
    if (!provider) return;
    setItems([]);
    setPage(1);
    setLoading(true);
    discover(mediaType, `watch_region=${provider.region}&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&${filterParam}&sort_by=popularity.desc&page=1`)
      .then((data) => {
        setItems(data.results || []);
        setTotalPages(data.total_pages || 1);
        setLoading(false);
      });
  }, [provider, mediaType, filterParam]);

  async function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    const data = await discover(mediaType, `watch_region=${provider.region}&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&${filterParam}&sort_by=popularity.desc&page=${nextPage}`);
    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.id));
      return [...prev, ...(data.results || []).filter((i) => !seen.has(i.id))];
    });
    setPage(nextPage);
    setLoading(false);
  }

  if (provider === undefined) return <div className="tv-loading">Loading…</div>;
  if (provider === null) {
    return (
      <div className="catfull-missing">
        Unknown network. <button onClick={() => navigate('/networks')}>See all networks</button>
      </div>
    );
  }

  return (
    <div className="catfull-page">
      <h1>{label} on {provider.name}</h1>
      <p className="catfull-count">{items.length} titles loaded</p>

      <div className="catfull-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className="catfull-card"
            onClick={() => navigate(`/${mediaType}/${item.id}`)}
          >
            <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
            <span className="catfull-rating">★ {item.vote_average?.toFixed(1)}</span>
          </button>
        ))}
      </div>

      {page < totalPages && (
        <button className="catfull-loadmore" onClick={loadMore} disabled={loading}>
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  );
}
