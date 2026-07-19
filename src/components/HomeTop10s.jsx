import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { discover, getNetworkList, PROVIDERS, IMG } from '../lib/tmdb';
import './HomeTop10s.css';

// Providers we already know the TMDB id for.
const KNOWN = [
  { label: 'Netflix', key: 'netflix' },
  { label: 'Prime Video', key: 'prime' },
  { label: 'HBO Max', key: 'hbomax' },
  { label: 'Apple TV+', key: 'appletv' },
  { label: 'Hulu', key: 'hulu' },
];

async function resolveShowmaxId() {
  const list = await getNetworkList();
  return list.find((n) => n.name?.toLowerCase() === 'showmax')?.id ?? null;
}

export default function HomeTop10s() {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    (async () => {
      const showmaxId = await resolveShowmaxId();
      const platformConfigs = [
        ...KNOWN.map((p) => ({ label: p.label, providerId: PROVIDERS[p.key]?.id, region: 'US' })),
        showmaxId ? { label: 'Showmax', providerId: showmaxId, region: 'ZA' } : null,
      ].filter(Boolean);

      const results = await Promise.all(
        platformConfigs.map(async (p) => {
          const [movies, tv] = await Promise.all([
            discover('movie', `watch_region=${p.region}&with_watch_providers=${p.providerId}&sort_by=popularity.desc`),
            discover('tv', `watch_region=${p.region}&with_watch_providers=${p.providerId}&sort_by=popularity.desc`),
          ]);
          return {
            label: p.label,
            movies: (movies.results || []).filter((m) => m.poster_path).slice(0, 10),
            tv: (tv.results || []).filter((m) => m.poster_path).slice(0, 10),
          };
        })
      );

      // Nollywood: Nigerian film industry — sourced by production
      // country, not a watch-provider (it isn't one).
      const nollywood = await discover('movie', 'with_origin_country=NG&sort_by=popularity.desc');
      results.push({
        label: 'Nollywood',
        movies: (nollywood.results || []).filter((m) => m.poster_path).slice(0, 10),
        tv: [],
      });

      setSections(results.filter((s) => s.movies.length || s.tv.length));
    })();
  }, []);

  if (!sections.length) return null;

  return (
    <section className="hometop10">
      <h2 className="hometop10-title">Top 10 by Network</h2>
      {sections.map((s) => (
        <div key={s.label} className="hometop10-block">
          <h3>{s.label}</h3>
          {s.movies.length > 0 && <RankedRow items={s.movies} type="movie" />}
          {s.tv.length > 0 && <RankedRow items={s.tv} type="tv" />}
        </div>
      ))}
    </section>
  );
}

function RankedRow({ items, type }) {
  const navigate = useNavigate();
  return (
    <div className="hometop10-track">
      {items.map((item, i) => (
        <button
          key={item.id}
          className="hometop10-card"
          onClick={() => navigate(`/${type}/${item.id}`)}
        >
          <span className="hometop10-rank">{i + 1}</span>
          <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
        </button>
      ))}
    </div>
  );
}
