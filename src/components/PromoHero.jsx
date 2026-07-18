import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import { usePosterColor } from '../hooks/usePosterColor';
import './PromoHero.css';

const ROTATE_MS = 7000;

export default function PromoHero({ items = [] }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const timer = useRef(null);
  const item = items[index];
  const color = usePosterColor(item ? IMG(item.poster_path, 'w342') : null);

  useEffect(() => {
    if (items.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [items.length]);

  if (!item) return <div className="promo-hero promo-hero-empty" />;

  const bg = color
    ? `linear-gradient(160deg, rgb(${color.r},${color.g},${color.b}) 0%, rgba(${color.r},${color.g},${color.b},0.4) 60%, transparent 100%)`
    : 'linear-gradient(160deg, #3a2a6d 0%, #1a1030 100%)';

  return (
    <div className="promo-hero" style={{ background: bg }}>
      <img className="promo-hero-bg" src={IMG(item.backdrop_path || item.poster_path, 'original')} alt="" />
      <div className="promo-hero-content">
        <span className="promo-hero-eyebrow">
          {item.media_type === 'tv' ? 'New Season' : 'New Release'}
        </span>
        <h2 className="promo-hero-title">{item.title || item.name}</h2>
        <p className="promo-hero-desc">{item.overview}</p>
        <button
          className="promo-hero-btn"
          onClick={() => navigate(`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`)}
        >
          Watch
        </button>
      </div>
    </div>
  );
}
