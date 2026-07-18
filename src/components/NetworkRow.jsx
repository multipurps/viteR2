import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetworkList } from '../lib/tmdb';
import './NetworkRow.css';

export default function NetworkRow({ title = 'Film Networks' }) {
  const [networks, setNetworks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getNetworkList().then(setNetworks);
  }, []);

  if (!networks.length) return null;

  return (
    <section className="netrow">
      <div className="netrow-head">
        <h2>{title}</h2>
        <button onClick={() => navigate('/networks')}>See all</button>
      </div>
      <div className="netrow-track">
        {networks.map((n) => (
          <button key={n.id} className="netrow-card glass" onClick={() => navigate(`/network/${n.key}`)}>
            <img src={n.logo} alt={n.name} />
          </button>
        ))}
      </div>
    </section>
  );
}
