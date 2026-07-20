import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMG } from '../lib/tmdb';
import PageBackdrop from './PageBackdrop';
import SaveButton from './SaveButton';
import './DetailLayout.css';

export default function DetailLayout({ item, mediaType, tags, onPlay, episodesSlot, children }) {
  const navigate = useNavigate();
  const cast = (item.credits?.cast || []).slice(0, 8);
  const similar = (item.recommendations?.results || []).filter((s) => s.poster_path).slice(0, 12);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareData = { title: item.title || item.name, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await handleCopyLink();
    }
    setMoreOpen(false);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
    setMoreOpen(false);
  }

  const videos = item.videos?.results || [];
  const trailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube');

  return (
    <div className="detail2">
      <PageBackdrop images={[IMG(item.poster_path, 'w780')]} />

      <button className="detail2-back" onClick={() => navigate(-1)} aria-label="Back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button className="detail2-more" onClick={() => setMoreOpen((v) => !v)} aria-label="More options">
        <svg width="18" height="4" viewBox="0 0 24 6" fill="currentColor"><circle cx="3" cy="3" r="3" /><circle cx="12" cy="3" r="3" /><circle cx="21" cy="3" r="3" /></svg>
      </button>
      {moreOpen && (
        <div className="detail2-more-menu glass" onMouseLeave={() => setMoreOpen(false)}>
          <button onClick={handleShare}>Share</button>
          <button onClick={handleCopyLink}>{copied ? 'Link copied' : 'Copy link'}</button>
        </div>
      )}

      <div className="detail2-hero-spacer">
        {(onPlay || trailer) && (
          <button
            className="detail2-play"
            onClick={() => (onPlay ? onPlay() : setTrailerOpen(true))}
            aria-label={onPlay ? 'Play' : 'Play trailer'}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4Z" /></svg>
          </button>
        )}
      </div>

      <div className="detail2-body">
        <span className="detail2-date">
          {(item.release_date || item.first_air_date || '').replace(/-/g, ' ')}
        </span>
        <h1 className="detail2-title">{item.title || item.name}</h1>

        <div className="detail2-tags">
          {tags.filter(Boolean).map((t) => (
            <span key={t} className="detail2-tag">{t}</span>
          ))}
        </div>

        <div className="detail2-stats">
          <span className="detail2-rating">★ {item.vote_average?.toFixed(1)}/10</span>
          <span className="detail2-votes">{formatCount(item.vote_count)} votes</span>
          <SaveButton mediaType={mediaType} mediaData={item} />
        </div>

        {trailer && (
          <button className="detail2-trailer-btn" onClick={() => setTrailerOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4Z" /></svg>
            Play trailer
          </button>
        )}

        {episodesSlot}

        {cast.length > 0 && (
          <div className="detail2-section">
            <div className="detail2-section-head">
              <h2>Cast</h2>
              <span className="detail2-seeall">See all</span>
            </div>
            <div className="detail2-cast-track">
              {cast.map((c) => (
                <div key={c.id} className="detail2-cast-card">
                  <img
                    src={c.profile_path ? IMG(c.profile_path, 'w185') : undefined}
                    alt={c.name}
                    className={c.profile_path ? '' : 'detail2-cast-placeholder'}
                  />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail2-section">
          <h2>Synopsis</h2>
          <p className="detail2-overview">{item.overview}</p>
        </div>

        {similar.length > 0 && (
          <div className="detail2-section">
            <h2>Similar to this</h2>
            <div className="detail2-cast-track">
              {similar.map((s) => (
                <button
                  key={s.id}
                  className="detail2-similar-card"
                  onClick={() => navigate(`/${mediaType}/${s.id}`)}
                >
                  <img src={IMG(s.poster_path, 'w342')} alt={s.title || s.name} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

        {children}
      </div>

      {trailerOpen && trailer && (
        <div className="detail2-modal" onClick={() => setTrailerOpen(false)}>
          <div className="detail2-modal-inner" onClick={(e) => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title="Trailer"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            <button className="detail2-modal-close" onClick={() => setTrailerOpen(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatCount(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
