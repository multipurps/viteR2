import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails, IMG } from '../lib/tmdb';
import SaveButton from '../components/SaveButton';
import './TvDetail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    (async () => setMovie(await getDetails('movie', id)))();
  }, [id]);

  if (!movie) return <div className="tv-loading">Loading…</div>;

  return (
    <div className="tv-detail">
      <div className="tv-bg">
        <img src={IMG(movie.backdrop_path || movie.poster_path, 'original')} alt="" />
        <div className="tv-bg-scrim" />
      </div>

      <div className="tv-header">
        <img className="tv-poster" src={IMG(movie.poster_path, 'w500')} alt={movie.title} />
        <div className="tv-about">
          <h1>{movie.title}</h1>
          <div className="tv-tags">
            <span className="tv-rating">★ {movie.vote_average?.toFixed(1)}</span>
            <span>{movie.release_date?.slice(0, 4)}</span>
            <span>{movie.runtime ? `${movie.runtime} min` : ''}</span>
            <span>{movie.genres?.map((g) => g.name).join(' · ')}</span>
          </div>
          <p className="tv-overview">{movie.overview}</p>
          <SaveButton mediaType="movie" mediaData={movie} />
        </div>
      </div>
    </div>
  );
}
