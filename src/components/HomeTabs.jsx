import { useState } from 'react';
import CategoryRows from './CategoryRows';
import { MOVIE_CATEGORIES, TV_CATEGORIES } from '../lib/categories';
import './HomeTabs.css';

export default function HomeTabs() {
  const [tab, setTab] = useState('movie');

  return (
    <section className="hometabs">
      <div className="hometabs-switch glass">
        <button className={tab === 'movie' ? 'active' : ''} onClick={() => setTab('movie')}>Movies</button>
        <button className={tab === 'tv' ? 'active' : ''} onClick={() => setTab('tv')}>TV Shows</button>
      </div>
      <CategoryRows
        mediaType={tab}
        categories={tab === 'movie' ? MOVIE_CATEGORIES : TV_CATEGORIES}
      />
    </section>
  );
}
