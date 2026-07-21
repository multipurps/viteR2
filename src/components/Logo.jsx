import logoMark from '../assets/logo-mark.png';
import './Logo.css';

// Real logo everywhere the app used to show a lime "Z" square —
// SideNav badge, sign-in/pending/blocked screens, mobile splash.
// Cropped from the settled frame of the user's splash animation; if a
// cleaner standalone logo file shows up later, swap the image import
// above and every usage updates.
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
