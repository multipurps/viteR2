import { useWatchlistToggle } from '../hooks/useWatchlistToggle';
import './SaveButton.css';

export default function SaveButton({ mediaType, mediaData }) {
  const { saved, busy, toggle } = useWatchlistToggle(mediaType, mediaData);

  return (
    <button className={`save-btn glass${saved ? ' saved' : ''}`} onClick={toggle} disabled={busy} aria-label="Save to watchlist">
      <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'}>
        <path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
