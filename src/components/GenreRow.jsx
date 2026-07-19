import { useNavigate } from 'react-router-dom';
import { discover } from '../lib/tmdb';
import { useEffect, useRef, useState } from 'react';
import { IMG } from '../lib/tmdb';
import './GenreRow.css';

const GENRES = [
  { label: 'Action', genre: 28 },
  { label: 'Comedy', genre: 35 },
  { label: 'Horror', genre: 27 },
  { label: 'Sci-Fi', genre: 878 },
  { label: 'Drama', genre: 18 },
  { label: 'Romance', genre: 10749 },
  { label: 'Animation', genre: 16 },
  { label: 'Documentary', genre: 99 },
];

export default function GenreRow() {
  const navigate = useNavigate();
  return (
    <section className="genrow">
      <h2 className="genrow-title">Genres</h2>
      <div className="genrow-track">
        {GENRES.map((g) => (
          <GenreTile key={g.genre} genre={g} onClick={() => navigate('/movies')} />
        ))}
      </div>
    </section>
  );
}

function GenreTile({ genre, onClick }) {
  const [posters, setPosters] = useState([]);
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    discover('movie', `with_genres=${genre.genre}&sort_by=popularity.desc`).then((data) => {
      setPosters((data.results || []).filter((m) => m.poster_path).slice(0, 5));
    });
  }, [genre.genre]);

  useEffect(() => {
    if (posters.length < 2) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % posters.length), 4000 + Math.random() * 1500);
    return () => clearInterval(timer.current);
  }, [posters.length]);

  return (
    <button className="genrow-tile" onClick={onClick}>
      {posters.map((p, i) => (
        <img key={p.id} src={IMG(p.poster_path, 'w342')} alt="" className={`genrow-tile-bg${i === index ? ' on' : ''}`} />
      ))}
      <div className="genrow-tile-scrim" />
      <span className="genrow-tile-label">{genre.label}</span>
    </button>
  );
}
