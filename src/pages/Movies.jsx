import BrowsePage from '../components/BrowsePage';
import { MOVIE_CATEGORIES } from '../lib/categories';

export default function Movies() {
  return (
    <BrowsePage
      mediaType="movie"
      categories={MOVIE_CATEGORIES}
      heroSource={{ kind: 'trending', window: 'week' }}
    />
  );
}
