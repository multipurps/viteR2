import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import PageBackdrop from './PageBackdrop';
import HeroSearchLink from './HeroSearchLink';
import HeroActions from './HeroActions';
import './PromoHero.css';

const ROTATE_MS = 7000;

export default function PromoHero({ items = [] }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const timer = useRef(null);
  const item = items[index];

  useEffect(() => {
    if (items.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [items.length]);

  const images = items.map((it) => IMG(it.backdrop_path || it.poster_path, 'original'));

  return (
    <>
      <PageBackdrop images={images} activeIndex={index} />

      {/* This wrap is normal-flow (not fixed) — the backdrop image behind
          it stays put while scrolling, but the search pill / title /
          action cluster all scroll away with the rest of the page, same
          as everything below the hero. Only shown here (Home) — Hero.jsx
          (Movies/TV/Search) doesn't render a search link at all. */}
      <div className="promo-hero-wrap">
        <HeroSearchLink />
        <div className="promo-hero-content">
          {item && (
            <>
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
            </>
          )}
        </div>
        {item && <HeroActions mediaType={item.media_type === 'tv' ? 'tv' : 'movie'} mediaData={item} />}
      </div>
    </>
  );
}
