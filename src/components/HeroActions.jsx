import { useWatchlistToggle } from '../hooks/useWatchlistToggle';
import './HeroActions.css';

// Three circular affordances over the hero (favorite / save / add),
// matching the reference design. The app only tracks a single saved
// flag today (the watchlist), so Favorite and Save both read and
// toggle that same flag — Add mirrors it too, but only ever adds.
export default function HeroActions({ mediaType, mediaData }) {
  const { saved, busy, toggle } = useWatchlistToggle(mediaType, mediaData);

  return (
    <div className="hero-actions-cluster">
      <button
        className={`hero-action-btn${saved ? ' active' : ''}`}
        onClick={toggle}
        disabled={busy}
        aria-label={saved ? 'Remove from favorites' : 'Add to favorites'}
      >
        <HeartIcon filled={saved} />
      </button>
      <button
        className={`hero-action-btn${saved ? ' active' : ''}`}
        onClick={toggle}
        disabled={busy}
        aria-label={saved ? 'Remove from watchlist' : 'Save to watchlist'}
      >
        <BookmarkIcon filled={saved} />
      </button>
      <button
        className="hero-action-btn"
        onClick={() => !saved && toggle()}
        disabled={busy || saved}
        aria-label="Add to watchlist"
      >
        <PlusIcon />
      </button>
    </div>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 21s-7.5-4.8-10-9.3C.4 8.4 2 5 5.4 5c2 0 3.4 1 6.6 4 3.2-3 4.6-4 6.6-4C21.9 5 23.5 8.4 22 11.7 19.5 16.2 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function BookmarkIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'}>
      <path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
