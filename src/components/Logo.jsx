import logoMark from '../assets/logo-mark.png';
import './Logo.css';

// Real logo everywhere the app used to show a lime "Z" square —
// SideNav badge, sign-in/pending/blocked screens, mobile splash. Uses
// the actual PWA app icon.
export default function Logo({ size = 34, className = '' }) {
  return (
    <img
      src={logoMark}
      alt="Zeeyus"
      className={`app-logo ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
