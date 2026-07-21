import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rateTitle, getUserRating, getStoryDna } from '../lib/supabase';
import './RatingWidget.css';

const OPTIONS = [
  { key: 'love', label: 'Love', icon: HeartIcon },
  { key: 'like', label: 'Like', icon: ThumbUpIcon },
  { key: 'dislike', label: 'Dislike', icon: ThumbDownIcon },
  { key: 'not_interested', label: 'Not for me', icon: XIcon },
];

// This is the signal that feeds the whole recommendation engine — see
// supabase/functions/recommend. Ratings + reasons get weighted into
// each user's taste profile; nothing here calls an AI directly except
// the one-time "suggested reasons" lookup after a Love rating, which
// is a cached Story DNA read (see getStoryDna).
export default function RatingWidget({ mediaType, mediaData }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [showReasons, setShowReasons] = useState(false);
  const [suggestedElements, setSuggestedElements] = useState([]);
  const [loadingElements, setLoadingElements] = useState(false);

  useEffect(() => {
    if (!user || !mediaData?.id) return;
    getUserRating(user.id, mediaData.id, mediaType).then((r) => {
      if (r) {
        setRating(r.rating);
        setReasons(r.reasons || []);
        if (r.rating === 'love') setShowReasons(true);
      }
    });
  }, [user, mediaData?.id, mediaType]);

  async function pick(key) {
    if (!user || !mediaData?.id) return;
    setRating(key);
    rateTitle(user.id, mediaType, mediaData.id, key, key === 'love' ? reasons : []).catch(() => {});

    if (key !== 'love') {
      setShowReasons(false);
      return;
    }
    setShowReasons(true);
    if (suggestedElements.length > 0) return;
    setLoadingElements(true);
    try {
      const dna = await getStoryDna(mediaData.id, mediaType);
      setSuggestedElements((dna?.specific_elements || []).slice(0, 8));
    } catch {
      // Suggestions are a nice-to-have — the rating itself already saved.
    }
    setLoadingElements(false);
  }

  async function toggleReason(el) {
    const next = reasons.includes(el)
      ? reasons.filter((r) => r !== el)
      : reasons.length < 3 ? [...reasons, el] : reasons;
    setReasons(next);
    rateTitle(user.id, mediaType, mediaData.id, 'love', next).catch(() => {});
  }

  if (!user) return null;

  return (
    <div className="ratingwidget">
      <div className="ratingwidget-row">
        {OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`ratingwidget-btn${rating === key ? ' active' : ''}`}
            onClick={() => pick(key)}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      {showReasons && (
        <div className="ratingwidget-reasons">
          <span>What did you love about this? (up to 3)</span>
          {loadingElements ? (
            <span className="ratingwidget-loading">Thinking…</span>
          ) : suggestedElements.length > 0 ? (
            <div className="ratingwidget-chips">
              {suggestedElements.map((el) => (
                <button
                  key={el}
                  className={reasons.includes(el) ? 'active' : ''}
                  onClick={() => toggleReason(el)}
                >
                  {formatElement(el)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function formatElement(el) {
  return el.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function HeartIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s-7.5-4.8-10-9.3C.4 8.4 2 5 5.4 5c2 0 3.4 1 6.6 4 3.2-3 4.6-4 6.6-4C21.9 5 23.5 8.4 22 11.7 19.5 16.2 12 21 12 21Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function ThumbUpIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3Zm0 0 4.5-7.5A2 2 0 0 1 13.5 3c1 0 2 .8 2 2v5h4a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 18.2 21H10a3 3 0 0 1-3-3v-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function ThumbDownIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3Zm0 0-4.5 7.5a2 2 0 0 1-2 1.5c-1 0-2-.8-2-2v-5H4.5a2 2 0 0 1-2-2.3l1.3-7A2 2 0 0 1 5.8 3H14a3 3 0 0 1 3 3v8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function XIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
