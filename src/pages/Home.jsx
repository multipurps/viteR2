import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PromoHero from '../components/PromoHero';
import Hero from '../components/Hero';
import HomeTabs from '../components/HomeTabs';
import GenreRow from '../components/GenreRow';
import NetworkRow, { POPULAR_NETWORKS } from '../components/NetworkRow';
import ContinueRow from '../components/ContinueRow';
import HomeTop10s from '../components/HomeTop10s';
import CategoryRows from '../components/CategoryRows';
import RevealOnScroll from '../components/RevealOnScroll';
import { getTrending } from '../lib/tmdb';
import { MOVIE_CATEGORIES, TV_CATEGORIES } from '../lib/categories';
import { useAuth } from '../context/AuthContext';
import { getContinueWatching } from '../lib/supabase';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'home';
  const setTab = (next) => {
    setSearchParams(next === 'home' ? {} : { tab: next });
  };

  const [homeHeroItems, setHomeHeroItems] = useState([]);
  const [tabHeroItems, setTabHeroItems] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);

  // Home's own hero — separate from the Movies/TV Shows tab heroes, so
  // switching tabs never stacks a second hero under this one.
  useEffect(() => {
    (async () => {
      const [trendingMovies, trendingTv] = await Promise.all([
        getTrending('movie', 'week'),
        getTrending('tv', 'week'),
      ]);
      const pool = [
        ...(trendingMovies.results || []).map((m) => ({ ...m, media_type: 'movie' })),
        ...(trendingTv.results || []).map((t) => ({ ...t, media_type: 'tv' })),
      ].filter((m) => m.backdrop_path);
      setHomeHeroItems(pool.slice(0, 6));
    })();
  }, []);

  // Movies/TV Shows tab hero — only fetched when one of those tabs is
  // actually selected, and replaces the Home hero entirely (never both).
  useEffect(() => {
    if (tab === 'home') return;
    (async () => {
      const data = await getTrending(tab, 'day');
      setTabHeroItems((data.results || []).filter((m) => m.backdrop_path).map((m) => ({ ...m, media_type: tab })).slice(0, 6));
    })();
  }, [tab]);

  useEffect(() => {
    if (!user) { setContinueWatching([]); return; }
    getContinueWatching(user.id).then((rows) => {
      const items = rows.map((r) => ({
        ...r.media_data,
        id: Number(r.media_id),
        media_type: r.media_type,
        progress: r.progress ?? 0,
        season: r.season,
        episode: r.episode,
      }));
      setContinueWatching(items);
    }).catch(() => setContinueWatching([]));
  }, [user]);

  return (
    <div>
      {tab === 'home' ? (
        <PromoHero items={homeHeroItems} />
      ) : (
        <Hero
          items={tabHeroItems}
          mediaType={tab}
          onPlay={(item) => navigate(`/${item.media_type}/${item.id}`)}
          onInfo={(item) => navigate(`/${item.media_type}/${item.id}`)}
        />
      )}

      <HomeTabs tab={tab} onChange={setTab} />

      {tab === 'home' && (
        <div style={{ marginTop: 0 }}>
          <GenreRow centered />
          <RevealOnScroll><NetworkRow title="Film Networks" curatedNames={POPULAR_NETWORKS} /></RevealOnScroll>
          {continueWatching.length > 0 && (
            <RevealOnScroll><ContinueRow items={continueWatching} /></RevealOnScroll>
          )}
          <RevealOnScroll><HomeTop10s /></RevealOnScroll>
        </div>
      )}

      {tab === 'movie' && (
        <div style={{ marginTop: 30 }}>
          <CategoryRows mediaType="movie" categories={MOVIE_CATEGORIES} />
        </div>
      )}

      {tab === 'tv' && (
        <div style={{ marginTop: 30 }}>
          <CategoryRows mediaType="tv" categories={TV_CATEGORIES} />
        </div>
      )}
    </div>
  );
}
