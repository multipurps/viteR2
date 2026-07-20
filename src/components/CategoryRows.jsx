import { useEffect, useState } from 'react';
import Row from './Row';
import RevealOnScroll from './RevealOnScroll';
import { resolveCategory } from '../lib/tmdb';
import { slugify } from '../lib/categories';

export default function CategoryRows({ mediaType, categories }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setRows([]);

    categories.forEach((cat) => {
      resolveCategory(cat, mediaType, 1, 12)
        .then(({ results }) => {
          if (cancelled) return;
          setRows((prev) => {
            const next = prev.filter((r) => r.title !== cat.title);
            next.push({ title: cat.title, items: results });
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
        <RevealOnScroll key={r.title}>
          <Row
            title={r.title}
            items={r.items}
            type={mediaType}
            seeAllTo={`/category/${mediaType}/${slugify(r.title)}`}
          />
        </RevealOnScroll>
      ))}
    </div>
  );
}
