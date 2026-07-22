import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations, getReminders, addReminder, removeReminder } from '../lib/supabase';
import { IMG } from '../lib/tmdb';
import LeftBehind from '../components/LeftBehind';
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
  const [reminders, setReminders] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    getRecommendations()
      .then((data) => {
        if (data?.new_user) { setState('new_user'); return; }
        setSections(data?.sections || {});
        setState('ready');
      })
      .catch(() => setState('error'));

    getReminders(user.id)
      .then((rows) => setReminders(new Set(rows.map((r) => `${r.media_type}:${r.tmdb_id}`))))
      .catch(() => {});
  }, [user]);

  async function toggleReminder(item) {
    const key = `${item.media_type}:${item.id}`;
    const next = new Set(reminders);
    if (next.has(key)) {
      next.delete(key);
      setReminders(next);
      removeReminder(user.id, item.id, item.media_type).catch(() => {});
    } else {
      next.add(key);
      setReminders(next);
      addReminder(user.id, item.id, item.media_type, item.release_date).catch(() => {});
    }
  }

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

  const hasAnything = flagship.length || sections.hidden_gems?.length || sections.coming_soon?.length || sections.just_for_tonight;

  if (state === 'error' || !hasAnything) {
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

      {sections.just_for_tonight && (
        <button
          className="aipicks-card"
          onClick={() => navigate(`/${sections.just_for_tonight.item.media_type}/${sections.just_for_tonight.item.id}`)}
        >
          <img src={IMG(sections.just_for_tonight.item.poster_path, 'w342')} alt={sections.just_for_tonight.item.title} loading="lazy" />
          <div className="aipicks-card-body">
            <span className="aipicks-card-label">Just for Tonight</span>
            <h2>{sections.just_for_tonight.item.title}</h2>
          </div>
        </button>
      )}

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

      {sections.coming_soon?.length > 0 && (
        <div className="aipicks-block">
          <h3>Coming Soon For You</h3>
          <div className="aipicks-track aipicks-track-wide">
            {sections.coming_soon.map((g) => {
              const key = `${g.media_type}:${g.id}`;
              const reminded = reminders.has(key);
              return (
                <div key={key} className="aipicks-soon-card">
                  <button onClick={() => navigate(`/${g.media_type}/${g.id}`)}>
                    <img src={IMG(g.poster_path, 'w342')} alt={g.title} loading="lazy" />
                  </button>
                  <span className="aipicks-soon-title">{g.title}</span>
                  {g.release_date && <span className="aipicks-soon-date">{g.release_date}</span>}
                  <button
                    className={`aipicks-remind-btn${reminded ? ' active' : ''}`}
                    onClick={() => toggleReminder(g)}
                  >
                    {reminded ? 'Reminding you' : 'Remind Me'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <LeftBehind />
    </div>
  );
}
