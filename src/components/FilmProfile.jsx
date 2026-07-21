import { useEffect, useState } from 'react';
import { getWatchlist } from '../lib/supabase';
import './FilmProfile.css';

// Official, stable TMDB genre ids (movie + TV combined) — unlike watch
// provider ids, these don't have confusing near-duplicates, so they're
// safe to hardcode.
const GENRE_NAMES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance',
  878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller', 10752: 'War',
  37: 'Western', 10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
  10768: 'War & Politics',
};

function computeStats(rows) {
  const items = rows.map((r) => r.media_data).filter(Boolean);
  const total = items.length;
  const movies = items.filter((i) => i._type === 'movie').length;
  const tv = total - movies;

  const genreCounts = new Map();
  const decadeCounts = new Map();
  let ratingSum = 0;
  let ratingCount = 0;

  for (const item of items) {
    for (const gid of item.genre_ids || []) {
      const name = GENRE_NAMES[gid];
      if (name) genreCounts.set(name, (genreCounts.get(name) || 0) + 1);
    }
    const date = item.release_date || item.first_air_date;
    if (date) {
      const decade = `${Math.floor(parseInt(date.slice(0, 4), 10) / 10) * 10}s`;
      if (!Number.isNaN(parseInt(decade, 10))) {
        decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);
      }
    }
    if (typeof item.vote_average === 'number' && item.vote_average > 0) {
      ratingSum += item.vote_average;
      ratingCount += 1;
    }
  }

  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) }));

  const topDecades = [...decadeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return {
    total,
    movies,
    tv,
    avgRating: ratingCount ? (ratingSum / ratingCount).toFixed(1) : null,
    topGenres,
    topDecades,
  };
}

export default function FilmProfile({ userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!userId) return;
    getWatchlist(userId).then((rows) => setStats(computeStats(rows))).catch(() => setStats(computeStats([])));
  }, [userId]);

  if (!stats) return null;

  if (stats.total === 0) {
    return (
      <section className="filmprofile glass">
        <h2>Your Film DNA</h2>
        <p className="filmprofile-empty">Save a few titles and this fills in with your actual taste — genres, eras, ratings.</p>
      </section>
    );
  }

  return (
    <section className="filmprofile glass">
      <h2>Your Film DNA</h2>
      <p className="filmprofile-sub">Built from your {stats.total} saved title{stats.total === 1 ? '' : 's'} — no guessing, just what you've actually saved.</p>

      <div className="filmprofile-stats">
        <div className="filmprofile-stat">
          <span className="filmprofile-num">{stats.movies}</span>
          <span className="filmprofile-label">Movies</span>
        </div>
        <div className="filmprofile-stat">
          <span className="filmprofile-num">{stats.tv}</span>
          <span className="filmprofile-label">TV Shows</span>
        </div>
        {stats.avgRating && (
          <div className="filmprofile-stat">
            <span className="filmprofile-num">★ {stats.avgRating}</span>
            <span className="filmprofile-label">Avg rating</span>
          </div>
        )}
      </div>

      {stats.topGenres.length > 0 && (
        <div className="filmprofile-block">
          <h3>Top genres</h3>
          <div className="filmprofile-bars">
            {stats.topGenres.map((g) => (
              <div key={g.name} className="filmprofile-bar-row">
                <span className="filmprofile-bar-label">{g.name}</span>
                <div className="filmprofile-bar-track">
                  <div className="filmprofile-bar-fill" style={{ width: `${g.pct}%` }} />
                </div>
                <span className="filmprofile-bar-count">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.topDecades.length > 0 && (
        <div className="filmprofile-block">
          <h3>Eras you gravitate to</h3>
          <div className="filmprofile-chips">
            {stats.topDecades.map(([decade, count]) => (
              <span key={decade} className="filmprofile-chip">{decade} <b>{count}</b></span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
