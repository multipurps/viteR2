import { useEffect, useState } from 'react';
import PromoHero from '../components/PromoHero';
import FeaturedRow from '../components/FeaturedRow';
import NetworkRow from '../components/NetworkRow';
import ContinueRow from '../components/ContinueRow';
import { getTrending } from '../lib/tmdb';
import { useAuth } from '../context/AuthContext';
import { getContinueWatching } from '../lib/supabase';

export default function Home() {
  const { user } = useAuth();
  const [heroItems, setHeroItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);

  // Blend of trending movies + trending TV, no hardcoded picks — same
  // pool feeds both the rotating hero and the Featured row.
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

      setHeroItems(pool.slice(0, 6));
      setFeaturedItems(pool.slice(6, 14));
    })();
  }, []);

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
      <PromoHero items={heroItems} />
      <div style={{ marginTop: 8 }}>
        <FeaturedRow items={featuredItems} />
        <NetworkRow title="By Networks" />
        {continueWatching.length > 0 && <ContinueRow items={continueWatching} />}
      </div>
    </div>
  );
}
