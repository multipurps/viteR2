import { useEffect, useRef, useState } from 'react';
import { IMG } from '../lib/tmdb';
import './Hero.css';

const ROTATE_MS = 7000;

export default function Hero({ items = [], onPlay, onInfo }) {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (items.length < 2) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [items.length]);

  if (!items.length) return <div className="hero hero-empty" />;
  const item = items[index];
  const title = item.title || item.name;
  const date = (item.release_date || item.first_air_date || '').slice(0, 7).replace('-', ', ');
  const genreLabel = item._genreLabel || '';

  return (
    <div className="hero">
      {items.map((it, i) => (
        <img
          key={it.id}
          src={IMG(it.backdrop_path, 'original')}
          alt=""
          className={`hero-bg${i === index ? ' on' : ''}`}
        />
      ))}
      <div className="hero-scrim" />

      <div className="hero-content">
        <div className="hero-meta">
          <span>{date}</span>
          {genreLabel && <span className="hero-dot" />}
          <span>{genreLabel}</span>
        </div>
        <h1 className="hero-title">{title}</h1>
        <div className="hero-actions">
          <button className="hero-btn hero-btn-solid" onClick={() => onPlay?.(item)}>
            <PlayIcon /> Watch now
          </button>
          <button className="hero-btn glass" onClick={() => onInfo?.(item)}>
            Trailer
          </button>
        </div>
      </div>

      <div className="hero-dots">
        {items.map((_, i) => (
          <button
            key={i}
            className={`hero-progress${i === index ? ' active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Show ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4Z" /></svg>;
}
