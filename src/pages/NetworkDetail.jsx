import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Hero from '../components/Hero';
import Row from '../components/Row';
import { RankedRow, resolveRealNetflixSection } from '../components/HomeTop10s';
import { discover, getNetworkList, PROVIDERS } from '../lib/tmdb';
import '../components/HomeTop10s.css';
import './NetworkDetail.css';

// Same genre set used to build the per-genre rows below — no more
// "All" scattergrid, every genre gets its own row (Movie vs TV ids
// differ on TMDB, hence two lists).
const GENRES_MOVIE = [
  { label: 'Action', genre: 28 },
  { label: 'Comedy', genre: 35 },
  { label: 'Drama', genre: 18 },
  { label: 'Horror', genre: 27 },
  { label: 'Sci-Fi', genre: 878 },
  { label: 'Fantasy', genre: 14 },
  { label: 'Kung Fu & Martial Arts', keywordId: 6075 },
  { label: 'Animation', genre: 16 },
  { label: 'Documentary', genre: 99 },
];

const GENRES_TV = [
  { label: 'Action', genre: 10759 },
  { label: 'Comedy', genre: 35 },
  { label: 'Drama', genre: 18 },
  { label: 'Crime', genre: 80 },
  { label: 'Sci-Fi', genre: 10765 },
  { label: 'Kung Fu & Martial Arts', keywordId: 6075 },
  { label: 'Reality', genre: 10764 },
  { label: 'Animation', genre: 16 },
  { label: 'Documentary', genre: 99 },
];

export default function NetworkDetail() {
  const { id } = useParams();
  const providerId = Number(id);
  const navigate = useNavigate();
  const [provider, setProvider] = useState(undefined); // undefined = loading, null = not found
  const [mediaType, setMediaType] = useState('movie');
  const [heroItems, setHeroItems] = useState([]);
  const [newItems, setNewItems] = useState([]);
  const [top10, setTop10] = useState({ items: [], real: false });
  const [genreRows, setGenreRows] = useState([]);

  const genreList = mediaType === 'movie' ? GENRES_MOVIE : GENRES_TV;

  useEffect(() => {
    getNetworkList().then((list) => {
      setProvider(list.find((p) => p.id === providerId) || null);
    });
  }, [providerId]);

  useEffect(() => {
    if (!provider) return;
    (async () => {
      const data = await discover(mediaType, `watch_region=${provider.region}&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&sort_by=popularity.desc`);
      setHeroItems((data.results || []).filter((i) => i.backdrop_path).slice(0, 6));
    })();
  }, [provider, mediaType]);

  useEffect(() => {
    if (!provider) return;
    (async () => {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
      const dateField = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
      const data = await discover(mediaType, `watch_region=${provider.region}&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&${dateField}.gte=${cutoff}&sort_by=popularity.desc`);
      setNewItems(data.results || []);
    })();
  }, [provider, mediaType]);

  // Top 10 — real weekly ranking for Netflix (same source as the home
  // page's Top 10 by Network), TMDB popularity for everyone else.
  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    (async () => {
      const isNetflix = provider.id === PROVIDERS.netflix?.id;
      if (isNetflix) {
        try {
          const real = await resolveRealNetflixSection(mediaType);
          if (real?.length && !cancelled) {
            setTop10({ items: real, real: true });
            return;
          }
        } catch {
          // fall through to the estimate below
        }
      }
      const data = await discover(mediaType, `watch_region=${provider.region}&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&sort_by=popularity.desc`);
      if (!cancelled) {
        setTop10({ items: (data.results || []).filter((i) => i.poster_path).slice(0, 10), real: false });
      }
    })();
    return () => { cancelled = true; };
  }, [provider, mediaType]);

  // Genre-categorized rows, replacing the old flat "everything" grid —
  // each genre resolves independently and appends as it comes in.
  useEffect(() => {
    if (!provider) return;
    let cancelled = false;
    setGenreRows([]);

    genreList.forEach((g) => {
      const filterParam = g.keywordId ? `with_keywords=${g.keywordId}` : `with_genres=${g.genre}`;
      discover(mediaType, `watch_region=${provider.region}&with_watch_providers=${provider.id}&with_watch_monetization_types=flatrate&${filterParam}&sort_by=popularity.desc`)
        .then((data) => {
          if (cancelled) return;
          const items = (data.results || []).filter((i) => i.poster_path);
          if (!items.length) return;
          setGenreRows((prev) => {
            const next = prev.filter((r) => r.label !== g.label);
            next.push({ label: g.label, items, genre: g.genre, keywordId: g.keywordId });
            const order = genreList.map((x) => x.label);
            return next.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
          });
        })
        .catch(() => {});
    });

    return () => { cancelled = true; };
  }, [provider, mediaType]); // eslint-disable-line react-hooks/exhaustive-deps

  if (provider === undefined) {
    return <div className="tv-loading">Loading…</div>;
  }
  if (provider === null) {
    return <div className="network-missing">Unknown network. <button onClick={() => navigate('/networks')}>See all networks</button></div>;
  }

  return (
    <div className="network-page">
      <Hero
        items={heroItems}
        onPlay={(item) => navigate(`/${mediaType}/${item.id}`)}
        onInfo={(item) => navigate(`/${mediaType}/${item.id}`)}
      />

      <div className="network-body">
        <div className="network-type-toggle">
          <button className={mediaType === 'movie' ? 'active' : ''} onClick={() => setMediaType('movie')}>Movies</button>
          <button className={mediaType === 'tv' ? 'active' : ''} onClick={() => setMediaType('tv')}>Series</button>
        </div>

        {newItems.length > 0 && <Row title="New" items={newItems.slice(0, 12)} type={mediaType} />}

        {top10.items.length > 0 && (
          <div className="hometop10-block">
            <div className="hometop10-block-head">
              <h3>Top 10 on {provider.name}</h3>
              <span className={`hometop10-badge${top10.real ? ' real' : ''}`}>
                {top10.real ? 'Real weekly ranking' : 'Estimated · TMDB popularity'}
              </span>
            </div>
            <RankedRow items={top10.items} type={mediaType} />
          </div>
        )}

        {genreRows.map((r) => (
          <Row
            key={r.label}
            title={r.label}
            items={r.items}
            type={mediaType}
            seeAllTo={`/network/${provider.id}/category?type=${mediaType}&label=${encodeURIComponent(r.label)}&${r.keywordId ? `keyword=${r.keywordId}` : `genre=${r.genre}`}`}
          />
        ))}
      </div>
    </div>
  );
}
