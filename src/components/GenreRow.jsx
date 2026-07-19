import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { discover, IMG } from '../lib/tmdb';
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
  const [posterSets, setPosterSets] = useState({}); // { genreId: [posters] }

  // Fetch all genres together so we can dedupe across them — otherwise
  // the same handful of overall-popular blockbusters (tagged with many
  // genres) win the #1 slot in nearly every tile.
  useEffect(() => {
    (async () => {
      const results = await Promise.all(
        GENRES.map((g) => discover('movie', `with_genres=${g.genre}&sort_by=popularity.desc`))
      );
      const used = new Set();
      const sets = {};
      GENRES.forEach((g, i) => {
        const pool = (results[i]?.results || []).filter((m) => m.poster_path);
        const unique = pool.filter((m) => !used.has(m.id));
        const chosen = (unique.length >= 4 ? unique : pool).slice(0, 5);
        chosen.forEach((m) => used.add(m.id));
        sets[g.genre] = chosen;
      });
      setPosterSets(sets);
    })();
  }, []);

  return (
    <section className="genrow">
      <h2 className="genrow-title">Featured</h2>
      <div className="genrow-track">
        {GENRES.map((g) => (
          <GenreTile
            key={g.genre}
            genre={g}
            posters={posterSets[g.genre] || []}
            onClick={() => navigate(`/search?genre=${g.genre}`)}
          />
        ))}
      </div>
    </section>
  );
}

function GenreTile({ genre, posters, onClick }) {
  const [index, setIndex] = useState(0);
  const timer = useRef(null);

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
