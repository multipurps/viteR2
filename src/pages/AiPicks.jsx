import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations } from '../lib/supabase';
import { IMG } from '../lib/tmdb';
import './AiPicks.css';

const LABELS = {
  gem_for_you: 'Gem for You',
  next_obsession: 'Your Next Obsession',
  same_energy: 'Same Energy, Different Story',
  unexpected: 'You May Not Expect This',
};

export default function AiPicks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState('loading'); // loading | new_user | error | ready
  const [sections, setSections] = useState({});

  useEffect(() => {
    if (!user) return;
    getRecommendations()
      .then((data) => {
        if (data?.new_user) { setState('new_user'); return; }
        setSections(data?.sections || {});
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [user]);

  if (state === 'loading') {
    return (
      <div className="aipicks-empty">
        <h1>For You</h1>
        <p>Learning your taste…</p>
      </div>
    );
  }

  if (state === 'new_user') {
    return (
      <div className="aipicks-empty">
        <h1>For You</h1>
        <p>Rate a few titles — Love, Like, Dislike — on anything you watch, and this fills in with picks built around what you actually respond to, not just genre.</p>
      </div>
    );
  }

  const flagship = ['gem_for_you', 'next_obsession', 'same_energy', 'unexpected']
    .map((key) => sections[key] && { key, ...sections[key] })
    .filter(Boolean);

  if (state === 'error' || (flagship.length === 0 && !sections.hidden_gems?.length)) {
    return (
      <div className="aipicks-empty">
        <h1>For You</h1>
        <p>Couldn't load your picks right now — try again in a bit.</p>
      </div>
    );
  }

  return (
    <div className="aipicks">
      <h1>For You</h1>
      <p className="aipicks-sub">Built from what you've actually rated — not just genre matching.</p>

      {flagship.map(({ key, item, explanation }) => (
        <button key={key} className="aipicks-card" onClick={() => navigate(`/${item.media_type}/${item.id}`)}>
          <img src={IMG(item.poster_path, 'w342')} alt={item.title} loading="lazy" />
          <div className="aipicks-card-body">
            <span className="aipicks-card-label">{LABELS[key] || key}</span>
            <h2>{item.title}</h2>
            {explanation && <p>{explanation}</p>}
          </div>
        </button>
      ))}

      {sections.because_you_loved && (
        <button
          className="aipicks-card"
          onClick={() => navigate(`/${sections.because_you_loved.item.media_type}/${sections.because_you_loved.item.id}`)}
        >
          <img src={IMG(sections.because_you_loved.item.poster_path, 'w342')} alt={sections.because_you_loved.item.title} loading="lazy" />
          <div className="aipicks-card-body">
            <span className="aipicks-card-label">Because you loved that</span>
            <h2>{sections.because_you_loved.item.title}</h2>
          </div>
        </button>
      )}

      {sections.hidden_gems?.length > 0 && (
        <div className="aipicks-block">
          <h3>Hidden Gems</h3>
          <div className="aipicks-track">
            {sections.hidden_gems.map((g) => (
              <button key={g.id} className="aipicks-gem" onClick={() => navigate(`/${g.media_type}/${g.id}`)}>
                <img src={IMG(g.poster_path, 'w342')} alt={g.title} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
