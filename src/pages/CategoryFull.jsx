import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resolveCategory, IMG } from '../lib/tmdb';
import { findCategoryBySlug } from '../lib/categories';
import './CategoryFull.css';

export default function CategoryFull() {
  const { mediaType, slug } = useParams();
  const navigate = useNavigate();
  const category = findCategoryBySlug(mediaType, slug);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return;
    setItems([]);
    setPage(1);
    setLoading(true);
    resolveCategory(category, mediaType, 1).then(({ results, totalPages }) => {
      setItems(results);
      setTotalPages(totalPages);
      setLoading(false);
    });
  }, [category, mediaType]);

  async function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    const { results } = await resolveCategory(category, mediaType, nextPage);
    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.id));
      return [...prev, ...results.filter((i) => !seen.has(i.id))];
    });
    setPage(nextPage);
    setLoading(false);
  }

  if (!category) {
    return (
      <div className="catfull-missing">
        Category not found. <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  return (
    <div className="catfull-page">
      <h1>{category.title}</h1>
      <p className="catfull-count">{items.length} titles loaded</p>

      <div className="catfull-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className="catfull-card"
            onClick={() => navigate(`/${item.media_type || mediaType}/${item.id}`)}
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
