import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetworkList, PROVIDERS } from '../lib/tmdb';
import './NetworkRow.css';

export default function NetworkRow({ title = 'Film Networks', curatedOnly = false, limit }) {
  const [networks, setNetworks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getNetworkList().then((list) => {
      let result = list;
      if (curatedOnly) {
        const knownIds = new Set(Object.values(PROVIDERS).map((p) => p.id));
        result = result.filter((n) => knownIds.has(n.id));
      }
      if (limit) result = result.slice(0, limit);
      setNetworks(result);
    });
  }, [curatedOnly, limit]);

  if (!networks.length) return null;

  return (
    <section className="netrow">
      <div className="netrow-head">
        <h2>{title}</h2>
        <button onClick={() => navigate('/networks')}>See all</button>
      </div>
      <div className="netrow-track">
        {networks.map((n) => (
          <button key={n.id} className="netrow-card" onClick={() => navigate(`/network/${n.id}`)}>
            <img src={n.logo} alt={n.name} />
          </button>
        ))}
      </div>
    </section>
  );
}
