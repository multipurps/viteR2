import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetworkList } from '../lib/tmdb';
import ScrollRow from './ScrollRow';
import './NetworkRow.css';

// The exact 20 platforms + order requested — matched by name against
// TMDB's live provider list rather than hardcoded provider IDs, since
// guessing IDs by hand is exactly what produced wrong/duplicate logos
// before (TMDB has near-duplicate entries per platform — e.g. "Amazon
// Video" vs "Amazon Prime Video" — so a wrong hardcoded id silently
// points at the wrong one).
export const POPULAR_NETWORKS = [
  'Netflix', 'Prime Video', 'Disney+', 'Max', 'Hulu', 'Apple TV+',
  'Paramount+', 'Peacock', 'Crunchyroll', 'MUBI', 'Shudder', 'AMC+',
  'STARZ', 'BritBox', 'Discovery+', 'BBC iPlayer', 'ITVX', 'Rakuten TV',
  'Tubi', 'Pluto TV',
];

function normalize(name) {
  return name.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]/g, '');
}

// Matches each requested name to a live TMDB provider, preserving the
// requested order. Exact normalized match wins; falls back to the
// shortest provider name that contains the target (handles TMDB's
// "Amazon Prime Video" vs our "Prime Video", "Disney Plus" vs
// "Disney+", etc.) without pulling in unrelated bundle variants like
// "Paramount+ with Showtime".
function matchCurated(list, names) {
  const used = new Set();
  const out = [];
  for (const name of names) {
    const target = normalize(name);
    let match = list.find((p) => !used.has(p.id) && normalize(p.name) === target);
    if (!match) {
      const candidates = list
        .filter((p) => !used.has(p.id) && normalize(p.name).includes(target))
        .sort((a, b) => a.name.length - b.name.length);
      match = candidates[0];
    }
    if (match) {
      used.add(match.id);
      out.push({ ...match, displayName: name });
    }
  }
  return out;
}

export default function NetworkRow({ title = 'Film Networks', curatedNames, limit }) {
  const [networks, setNetworks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getNetworkList().then((list) => {
      let result = list;
      if (curatedNames?.length) {
        result = matchCurated(list, curatedNames);
      } else if (limit) {
        result = result.slice(0, limit);
      }
      setNetworks(result);
    });
  }, [curatedNames, limit]);

  if (!networks.length) return null;

  return (
    <section className="netrow">
      <div className="netrow-head">
        <h2>{title}</h2>
        <button onClick={() => navigate('/networks')}>See all</button>
      </div>
      <ScrollRow className="netrow-track">
        {networks.map((n) => (
          <button key={n.id} className="netrow-card" onClick={() => navigate(`/network/${n.id}`)}>
            <img src={n.logo} alt={n.displayName || n.name} />
          </button>
        ))}
      </ScrollRow>
    </section>
  );
}
