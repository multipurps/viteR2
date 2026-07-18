import { NavLink } from 'react-router-dom';
import './SideNav.css';

const ITEMS = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/search', label: 'Search', icon: SearchIcon },
  { to: '/movies', label: 'Movies', icon: MovieIcon },
  { to: '/tv', label: 'TV Shows', icon: TvIcon },
  { to: '/top10', label: 'Top 10s', icon: Top10Icon },
  { to: '/watchlist', label: 'Watchlist', icon: HeartIcon },
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
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.5" d="M13.1061 22H10.8939C7.44737 22 5.72409 22 4.54903 20.9882C3.37396 19.9764 3.13025 18.2827 2.64284 14.8952L2.36407 12.9579C1.98463 10.3208 1.79491 9.00229 2.33537 7.87495C2.87583 6.7476 4.02619 6.06234 6.32691 4.69181L7.71175 3.86687C9.80104 2.62229 10.8457 2 12 2C13.1543 2 14.199 2.62229 16.2882 3.86687L17.6731 4.69181C19.9738 6.06234 21.1242 6.7476 21.6646 7.87495C22.2051 9.00229 22.0154 10.3208 21.6359 12.9579L21.3572 14.8952C20.8697 18.2827 20.626 19.9764 19.451 20.9882C18.2759 22 16.5526 22 13.1061 22Z" fill="currentColor" />
      <path fillRule="evenodd" clipRule="evenodd" d="M12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V15C11.25 14.5858 11.5858 14.25 12 14.25C12.4142 14.25 12.75 14.5858 12.75 15V18C12.75 18.4142 12.4142 18.75 12 18.75Z" fill="currentColor" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.1" d="M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" fill="currentColor" />
      <path d="M17 17L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
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
function HeartIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M45.35 6.1709H19.41C16.8178 6.17618 14.3333 7.20827 12.5003 9.04123C10.6674 10.8742 9.63528 13.3587 9.62999 15.9509V52.2709C9.6272 53.3655 9.92973 54.4392 10.5036 55.3713C11.0775 56.3034 11.9 57.057 12.8787 57.5474C13.8573 58.0377 14.9533 58.2454 16.0435 58.1471C17.1337 58.0488 18.1748 57.6484 19.05 56.9909L31.25 47.8509C31.5783 47.6074 31.9762 47.4759 32.385 47.4759C32.7938 47.4759 33.1917 47.6074 33.52 47.8509L45.71 56.9809C46.5842 57.6387 47.6246 58.0397 48.7142 58.1387C49.8038 58.2378 50.8994 58.0311 51.8779 57.5418C52.8565 57.0525 53.6793 56.3001 54.2537 55.3689C54.8282 54.4378 55.1317 53.365 55.13 52.2709V15.9509C55.1247 13.3587 54.0926 10.8742 52.2597 9.04123C50.4267 7.20827 47.9422 6.17618 45.35 6.1709Z" fill="currentColor" />
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path opacity="0.4" d="M12.1605 10.87C12.0605 10.86 11.9405 10.86 11.8305 10.87C9.45055 10.79 7.56055 8.84 7.56055 6.44C7.56055 3.99 9.54055 2 12.0005 2C14.4505 2 16.4405 3.99 16.4405 6.44C16.4305 8.84 14.5405 10.79 12.1605 10.87Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.1607 14.56C4.7407 16.18 4.7407 18.82 7.1607 20.43C9.9107 22.27 14.4207 22.27 17.1707 20.43C19.5907 18.81 19.5907 16.17 17.1707 14.56C14.4307 12.73 9.9207 12.73 7.1607 14.56Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SparkIcon() {
  return <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
