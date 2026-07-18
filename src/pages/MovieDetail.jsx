import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDetails } from '../lib/tmdb';
import DetailLayout from '../components/DetailLayout';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    (async () => setMovie(await getDetails('movie', id)))();
  }, [id]);

  if (!movie) return <div className="tv-loading">Loading…</div>;

  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min` : null;

  return (
    <DetailLayout
      item={movie}
      mediaType="movie"
      tags={[runtime, movie.genres?.[0]?.name, 'Movie', movie.adult ? '18+' : null]}
    />
  );
}
