import './GenreChips.css';

export const HOME_GENRES = [
  { label: 'All', genre: null },
  { label: 'Adventure', genre: 12 },
  { label: 'Comedy', genre: 35 },
  { label: 'Fantasy', genre: 14 },
  { label: 'Action', genre: 28 },
  { label: 'Drama', genre: 18 },
  { label: 'Horror', genre: 27 },
  { label: 'Sci-Fi', genre: 878 },
];

export default function GenreChips({ active, onChange }) {
  return (
    <div className="genre-chips">
      {HOME_GENRES.map((g) => (
        <button
          key={g.label}
          className={`genre-chip${active === g.genre ? ' active' : ''}`}
          onClick={() => onChange(g.genre)}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
