import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import PageBackdrop from './PageBackdrop';
import HeroSearchLink from './HeroSearchLink';
import HeroActions from './HeroActions';
import './PromoHero.css';

const ROTATE_MS = 7000;

// personalized (optional): { eyebrow, blurb, explanation, item } from
// the recommend Edge Function. When present, this replaces the
// trending rotation entirely with a single editorial pick — see
// Home.jsx for how it's chosen and the trending fallback for
// new/errored users.
export default function PromoHero({ items = [], personalized }) {
  const [index, setIndex] = useState(0);
  const [whyOpen, setWhyOpen] = useState(false);
  const navigate = useNavigate();
  const timer = useRef(null);
  const item = personalized ? personalized.item : items[index];

  useEffect(() => {
    if (personalized || items.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [items.length, personalized]);

  const images = personalized
    ? [IMG(item.backdrop_path || item.poster_path, 'original')]
    : items.map((it) => IMG(it.backdrop_path || it.poster_path, 'original'));

  return (
    <>
      <PageBackdrop images={images} activeIndex={personalized ? 0 : index} />

      <div className="promo-hero-wrap">
        <HeroSearchLink />
        <div className="promo-hero-content">
          {item && (
            <>
              <span className="promo-hero-eyebrow">
                {personalized ? personalized.eyebrow : item.media_type === 'tv' ? 'New Season' : 'New Release'}
              </span>
              <h2 className="promo-hero-title">{item.title || item.name}</h2>
              <p className="promo-hero-desc">{personalized ? personalized.blurb : item.overview}</p>
              <div className="promo-hero-row">
                <button
                  className="promo-hero-btn"
                  onClick={() => navigate(`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`)}
                >
                  Watch
                </button>
                {personalized?.explanation && (
                  <button className="promo-hero-why" onClick={() => setWhyOpen((v) => !v)}>
                    {whyOpen ? 'Hide reason' : 'Why this pick?'}
                  </button>
                )}
              </div>
              {personalized && whyOpen && <p className="promo-hero-explanation">{personalized.explanation}</p>}
            </>
          )}
        </div>
        {item && <HeroActions mediaType={item.media_type === 'tv' ? 'tv' : 'movie'} mediaData={item} />}
      </div>
    </>
  );
}
