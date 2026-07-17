import { NavLink } from 'react-router-dom';
import './SideNav.css';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/movies', label: 'Movies', icon: MovieIcon },
  { to: '/tv', label: 'TV Shows', icon: TvIcon },
  { to: '/top10', label: 'Top 10s', icon: Top10Icon },
  { to: '/watchlist', label: 'Watchlist', icon: BookmarkIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
  { to: '/ai', label: 'AI Picks', icon: SparkIcon },
];

export default function SideNav() {
  return (
    <nav className="sidenav glass-strong">
      <div className="sidenav-mark">Z</div>
      <ul className="sidenav-list">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => `sidenav-item${isActive ? ' active' : ''}`}
            >
              <span className="sidenav-icon"><Icon /></span>
              <span className="sidenav-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M4 11.5 12 4l8 7.5M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function MovieIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 5v14M16 5v14M3 9h5M16 9h5M3 15h5M16 15h5" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function TvIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M8 21h8M9 3l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function Top10Icon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M6 20V10M12 20V4M18 20v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function BookmarkIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M6 3h12v18l-6-4-6 4V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}
function ProfileIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}
function SparkIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
