import { useEffect, useRef, useState } from 'react';
import './ScrollRow.css';

// Wraps any horizontally-scrolling track with prev/next arrow buttons —
// for desktop (no touch) and TV browsers (no swipe gesture at all).
// Arrows are NOT hidden by a screen-width media query: TV browsers have
// already shown they can misreport their viewport as "narrow" even on a
// huge screen, so a width-based hide would risk vanishing on exactly the
// devices that need it most. They're small/subtle instead, which works
// fine on touch too (swipe still works there, arrows are just extra).
export default function ScrollRow({ className, children }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;

    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, [children]);

  function scroll(dir) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  }

  return (
    <div className="scrollrow-wrap">
      <button
        className={`scrollrow-arrow scrollrow-arrow-left${canLeft ? '' : ' scrollrow-arrow-hidden'}`}
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        tabIndex={canLeft ? 0 : -1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <div className={className} ref={trackRef}>
        {children}
      </div>
      <button
        className={`scrollrow-arrow scrollrow-arrow-right${canRight ? '' : ' scrollrow-arrow-hidden'}`}
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        tabIndex={canRight ? 0 : -1}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );
}
