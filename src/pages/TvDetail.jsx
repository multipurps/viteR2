import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getDetails, getSeason, IMG } from '../lib/tmdb';
import DetailLayout from '../components/DetailLayout';
import Player from '../components/Player';
import './TvEpisodes.css';

export default function TvDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [show, setShow] = useState(null);
  const [season, setSeason] = useState(() => Number(searchParams.get('season')) || 1);
  const [episodes, setEpisodes] = useState([]);
  const [playing, setPlaying] = useState(null); // null | { season, episode }

  useEffect(() => {
    (async () => setShow(await getDetails('tv', id)))();
  }, [id]);

  useEffect(() => {
    if (!show) return;
    (async () => setEpisodes((await getSeason(id, season)).episodes || []))();
  }, [show, season, id]);

  // Coming from "Continue Watching" (?season=&episode=) resumes straight into the player.
  useEffect(() => {
    if (!show) return;
    const ep = searchParams.get('episode');
    if (ep) setPlaying({ season: Number(searchParams.get('season')) || 1, episode: Number(ep) });
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return <div className="tv-loading">Loading…</div>;

  return (
    <>
      <DetailLayout
        item={show}
        mediaType="tv"
        tags={[`${show.number_of_seasons} season${show.number_of_seasons === 1 ? '' : 's'}`, show.genres?.[0]?.name, 'Series', show.adult ? '18+' : null]}
        onPlay={() => setPlaying({ season, episode: 1 })}
      >
        <div className="detail2-section">
          <div className="detail2-section-head">
            <h2>Episodes</h2>
          </div>
          <div className="ep-season-picker">
            {show.seasons?.filter((s) => s.season_number > 0).map((s) => (
              <button
                key={s.id}
                className={`ep-season-btn${season === s.season_number ? ' active' : ''}`}
                onClick={() => setSeason(s.season_number)}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="ep-list">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                className="ep-card glass"
                onClick={() => setPlaying({ season, episode: ep.episode_number })}
              >
                <img
                  className="ep-thumb"
                  src={IMG(ep.still_path, 'w300') || IMG(show.backdrop_path, 'w300')}
                  alt={ep.name}
                />
                <div className="ep-info">
                  <div className="ep-top">
                    <span className="ep-num">E{ep.episode_number}</span>
                    <span className="ep-name">{ep.name}</span>
                    <span className="ep-rating">★ {ep.vote_average?.toFixed(1)}</span>
                  </div>
                  <p className="ep-overview">{ep.overview || 'No synopsis available.'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DetailLayout>
      {playing && (
        <Player
          item={show}
          mediaType="tv"
          initialSeason={playing.season}
          initialEpisode={playing.episode}
          onClose={() => setPlaying(null)}
        />
      )}
    </>
  );
}
