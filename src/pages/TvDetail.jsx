import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, getSeason, IMG } from '../lib/tmdb';
import SaveButton from '../components/SaveButton';
import './TvDetail.css';

export default function TvDetail() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [season, setSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getDetails('tv', id);
      setShow(data);
    })();
  }, [id]);

  useEffect(() => {
    if (!show) return;
    (async () => {
      const data = await getSeason(id, season);
      setEpisodes(data.episodes || []);
    })();
  }, [show, season, id]);

  if (!show) return <div className="tv-loading">Loading…</div>;

  return (
    <div className="tv-detail">
      {/* Poster becomes the ambient background for the whole page */}
      <div className="tv-bg">
        <img src={IMG(show.backdrop_path || show.poster_path, 'original')} alt="" />
        <div className="tv-bg-scrim" />
      </div>

      <div className="tv-header">
        <img className="tv-poster" src={IMG(show.poster_path, 'w500')} alt={show.name} />
        <div className="tv-about">
          <h1>{show.name}</h1>
          <div className="tv-tags">
            <span className="tv-rating">★ {show.vote_average?.toFixed(1)}</span>
            <span>{show.first_air_date?.slice(0, 4)}</span>
            <span>{show.genres?.map((g) => g.name).join(' · ')}</span>
          </div>
          <p className="tv-overview">{show.overview}</p>

          <div className="tv-header-row">
            <div className="tv-season-picker">
              {show.seasons
                ?.filter((s) => s.season_number > 0)
                .map((s) => (
                  <button
                    key={s.id}
                    className={`tv-season-btn${season === s.season_number ? ' active' : ''}`}
                    onClick={() => setSeason(s.season_number)}
                  >
                    {s.name}
                  </button>
                ))}
            </div>
            <SaveButton mediaType="tv" mediaData={show} />
          </div>
        </div>
      </div>

      <div className="tv-episodes">
        {episodes.map((ep) => (
          <div key={ep.id} className="tv-episode-card glass">
            <img
              className="tv-episode-thumb"
              src={IMG(ep.still_path, 'w300') || IMG(show.backdrop_path, 'w300')}
              alt={ep.name}
            />
            <div className="tv-episode-info">
              <div className="tv-episode-top">
                <span className="tv-episode-num">E{ep.episode_number}</span>
                <span className="tv-episode-name">{ep.name}</span>
                <span className="tv-episode-rating">★ {ep.vote_average?.toFixed(1)}</span>
              </div>
              <p className="tv-episode-overview">{ep.overview || 'No synopsis available.'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
