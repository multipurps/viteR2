import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails } from '../lib/tmdb';
import DetailLayout from '../components/DetailLayout';
import Player from '../components/Player';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    (async () => setMovie(await getDetails('movie', id)))();
  }, [id]);

  if (!movie) return <div className="tv-loading">Loading…</div>;

  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min` : null;

  return (
    <>
      <DetailLayout
        item={movie}
        mediaType="movie"
        tags={[runtime, movie.genres?.[0]?.name, 'Movie', movie.adult ? '18+' : null]}
        onPlay={() => setPlaying(true)}
      />
      {playing && (
        <Player item={movie} mediaType="movie" onClose={() => setPlaying(false)} />
      )}
    </>
  );
}
