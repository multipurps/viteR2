import { useEffect, useState } from 'react';
import Row from './Row';
import { resolveCategory } from '../lib/tmdb';

export default function CategoryRows({ mediaType, categories }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setRows([]);

    categories.forEach((cat) => {
      resolveCategory(cat, mediaType)
        .then((items) => {
          if (cancelled) return;
          setRows((prev) => {
            const next = prev.filter((r) => r.title !== cat.title);
            next.push({ title: cat.title, items });
            const order = categories.map((c) => c.title);
            return next.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
          });
        })
        .catch(() => {});
    });

    return () => { cancelled = true; };
  }, [mediaType, categories]);

  return (
    <div>
      {rows.map((r) => (
        <Row key={r.title} title={r.title} items={r.items} type={mediaType} />
      ))}
    </div>
  );
}
