import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { discover, getNetworkList, searchMulti, PROVIDERS, IMG } from '../lib/tmdb';
import { getNetflixTop10 } from '../lib/supabase';
import ScrollRow from './ScrollRow';
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

// Matches real Netflix title strings back to TMDB entries so we still
// get poster art + ids, while keeping Netflix's own real ranking order.
export async function resolveRealNetflixSection(mediaType) {
  const titles = await getNetflixTop10(mediaType === 'tv' ? 'tv' : 'movies');
  if (!titles?.length) return null;
  const matches = await Promise.all(
    titles.map(async (title) => {
      const data = await searchMulti(title).catch(() => null);
      const hit = data?.results?.find((r) => (r.media_type === mediaType) && r.poster_path);
      return hit || null;
    })
  );
  return matches.filter(Boolean);
}

export default function HomeTop10s() {
  const [sections, setSections] = useState([]);
  // Which list (movie/tv) is showing per network, keyed by label.
  const [activeType, setActiveType] = useState({});

  useEffect(() => {
    (async () => {
      const showmaxId = await resolveShowmaxId();
      const platformConfigs = [
        ...KNOWN.map((p) => ({ label: p.label, providerId: PROVIDERS[p.key]?.id, region: 'US' })),
        showmaxId ? { label: 'Showmax', providerId: showmaxId, region: 'ZA' } : null,
      ].filter(Boolean);

      const results = await Promise.all(
        platformConfigs.map(async (p) => {
          const isNetflix = p.label === 'Netflix';
          let movies = null;
          let tv = null;
          let real = false;

          if (isNetflix) {
            try {
              const [realMovies, realTv] = await Promise.all([
                resolveRealNetflixSection('movie'),
                resolveRealNetflixSection('tv'),
              ]);
              if (realMovies?.length || realTv?.length) {
                movies = realMovies || [];
                tv = realTv || [];
                real = true;
              }
            } catch {
              // Edge Function not deployed yet, or fetch failed — fall
              // through to the estimate below instead of showing nothing.
            }
          }

          if (movies === null) {
            const [m, t] = await Promise.all([
              discover('movie', `watch_region=${p.region}&with_watch_providers=${p.providerId}&with_watch_monetization_types=flatrate&sort_by=popularity.desc`),
              discover('tv', `watch_region=${p.region}&with_watch_providers=${p.providerId}&with_watch_monetization_types=flatrate&sort_by=popularity.desc`),
            ]);
            movies = (m.results || []).filter((x) => x.poster_path).slice(0, 10);
            tv = (t.results || []).filter((x) => x.poster_path).slice(0, 10);
          }

          return { label: p.label, movies, tv, real };
        })
      );

      // Nollywood: Nigerian film industry — sourced by production
      // country, not a watch-provider (it isn't one).
      const nollywood = await discover('movie', 'with_origin_country=NG&sort_by=popularity.desc');
      results.push({
        label: 'Nollywood',
        movies: (nollywood.results || []).filter((m) => m.poster_path).slice(0, 10),
        tv: [],
        real: false,
      });

      const withData = results.filter((s) => s.movies.length || s.tv.length);
      setSections(withData);
      // Default each network to whichever list has titles — movies first.
      setActiveType(
        Object.fromEntries(withData.map((s) => [s.label, s.movies.length ? 'movie' : 'tv']))
      );
    })();
  }, []);

  if (!sections.length) return null;

  return (
    <section className="hometop10">
      <h2 className="hometop10-title">Top 10 by Network</h2>
      {sections.map((s) => {
        const hasBoth = s.movies.length > 0 && s.tv.length > 0;
        const type = activeType[s.label] || (s.movies.length ? 'movie' : 'tv');
        const items = type === 'movie' ? s.movies : s.tv;

        return (
          <div key={s.label} className="hometop10-block">
            <div className="hometop10-block-head">
              <h3>{s.label} Top 10</h3>
              <span className={`hometop10-badge${s.real ? ' real' : ''}`}>
                {s.real ? 'Real weekly ranking' : 'Estimated · TMDB popularity'}
              </span>
              {hasBoth && (
                <div className="hometop10-switch">
                  <button
                    className={type === 'movie' ? 'active' : ''}
                    onClick={() => setActiveType((cur) => ({ ...cur, [s.label]: 'movie' }))}
                  >
                    Movies
                  </button>
                  <button
                    className={type === 'tv' ? 'active' : ''}
                    onClick={() => setActiveType((cur) => ({ ...cur, [s.label]: 'tv' }))}
                  >
                    Shows
                  </button>
                </div>
              )}
            </div>
            <RankedRow items={items} type={type} />
          </div>
        );
      })}
    </section>
  );
}

export function RankedRow({ items, type }) {
  const navigate = useNavigate();
  return (
    <ScrollRow className="hometop10-track">
      {items.map((item, i) => (
        <button
          key={item.id}
          className="hometop10-card"
          onClick={() => navigate(`/${item.media_type || type}/${item.id}`)}
        >
          <span className="hometop10-rank">{i + 1}</span>
          <img src={IMG(item.poster_path, 'w342')} alt={item.title || item.name} loading="lazy" />
        </button>
      ))}
    </ScrollRow>
  );
}
