import './HomeTabs.css';

const TABS = [
  { key: 'home', label: 'Home' },
  { key: 'movie', label: 'Movies' },
  { key: 'tv', label: 'TV Shows' },
];

// Pure tab switcher — no hero, no data fetching. Home.jsx owns the tab
// state and decides what to render below based on it, so there's never
// a second hero rendered underneath the main one.
export default function HomeTabs({ tab, onChange }) {
  return (
    <div className="hometabs-switch glass">
      {TABS.map((t) => (
        <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => onChange(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}
