import { useEffect, useRef, useState } from 'react';
import { IMG } from '../lib/tmdb';
import PageBackdrop from './PageBackdrop';
import HeroActions from './HeroActions';
import './Hero.css';

const ROTATE_MS = 7000;

// No search link here on purpose — the top search pill only belongs on
// the actual Home screen (PromoHero). This is the hero used on
// Movies/TV tabs, /movies, /tv, and Search's browse state.
export default function Hero({ items = [], onPlay, onInfo, mediaType }) {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (items.length < 2) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [items.length]);

  const item = items[index];
  const images = items.map((it) => IMG(it.backdrop_path, 'original'));
  const mt = item ? (item.media_type || mediaType || (item.first_air_date ? 'tv' : 'movie')) : mediaType;

  return (
    <>
      <PageBackdrop images={images} activeIndex={index} />

      {/* Normal-flow wrap (not fixed) — title/actions/dots scroll away
          with the page; only the backdrop image behind them stays put. */}
      <div className="hero-wrap">
        <div className="hero-content">
          {item && (
            <>
              <div className="hero-meta">
                <span>{(item.release_date || item.first_air_date || '').slice(0, 7).replace('-', ', ')}</span>
                {item._genreLabel && <span className="hero-dot" />}
                <span>{item._genreLabel || ''}</span>
              </div>
              <h1 className="hero-title">{item.title || item.name}</h1>
              <div className="hero-actions">
                <button className="hero-btn hero-btn-solid" onClick={() => onPlay?.(item)}>
                  <PlayIcon /> Watch now
                </button>
                <button className="hero-btn glass" onClick={() => onInfo?.(item)}>
                  Trailer
                </button>
              </div>
            </>
          )}
        </div>

        {item && <HeroActions mediaType={mt} mediaData={item} />}

        {items.length > 1 && (
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
        )}
      </div>
    </>
  );
}

function PlayIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4Z" /></svg>;
}
