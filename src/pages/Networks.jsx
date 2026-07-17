import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNetworkList } from '../lib/tmdb';
import './Networks.css';

export default function Networks() {
  const [networks, setNetworks] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getNetworkList().then(setNetworks);
  }, []);

  return (
    <div className="networks-page">
      <h1>Networks</h1>
      <div className="networks-grid">
        {networks?.map((n) => (
          <button key={n.id} className="networks-card glass" onClick={() => navigate(`/network/${n.key}`)}>
            <img src={n.logo} alt={n.name} />
            <span>{n.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
