import { useNavigate } from 'react-router-dom';
import './TopBar.css';

export default function TopBar() {
  const navigate = useNavigate();
  return (
    <button className="topbar glass" onClick={() => navigate('/search')}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span>Search for Movie</span>
    </button>
  );
}
