import { useEffect, useState } from 'react';

// Reads pixel data from the poster to get its dominant color, so the
// detail page background is actually derived from the artwork — not a
// blurred copy of it and not a fixed brand color.
export function usePosterColor(src) {
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const w = (canvas.width = 24);
        const h = (canvas.height = 36);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2];
          count++;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        // Darken toward the app background so text stays readable
        const mix = (c) => Math.round(c * 0.55 + 6 * 0.45);
        setColor({ r: mix(r), g: mix(g), b: mix(b) });
      } catch {
        setColor(null); // CORS or decode failure — caller falls back to default bg
      }
    };
    img.onerror = () => setColor(null);
    return () => { cancelled = true; };
  }, [src]);

  return color;
}
