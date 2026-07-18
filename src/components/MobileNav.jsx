import { useRef, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './MobileNav.css';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/watchlist', label: 'Favorites', icon: HeartIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
];

export default function MobileNav() {
  const location = useLocation();
  const trackRef = useRef(null);
  const [indicator, setIndicator] = useState({ x: 0, w: 0 });

  const activeIndex = Math.max(
    0,
    ITEMS.findIndex((i) => (i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to)))
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const el = track.children[activeIndex];
    if (el) setIndicator({ x: el.offsetLeft, w: el.offsetWidth });
  }, [activeIndex]);

  return (
    <nav className="mobilenav glass-strong">
      <div className="mobilenav-track" ref={trackRef}>
        <div className="mobilenav-liquid" style={{ transform: `translateX(${indicator.x}px)`, width: indicator.w }} />
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `mobilenav-item${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon() { return <svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m21 21-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function HeartIcon() { return <svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>; }
function ProfileIcon() { return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
