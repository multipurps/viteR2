import { useEffect, useRef, useState } from 'react';

// Content starts VISIBLE, not hidden. It only ever animates in an extra
// fade/rise on top of that when the IntersectionObserver fires — it never
// depends on the observer firing to become visible in the first place.
// (Older TV/smart-TV browsers can fail to fire IntersectionObserver
// reliably, and the previous version started at opacity:0, which meant
// entire rows stayed permanently invisible on those devices.)
export default function RevealOnScroll({ children, delay = 0 }) {
  const ref = useRef(null);
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLifted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: 1,
        transform: lifted ? 'translateY(0)' : 'translateY(10px)',
        transition: `transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
