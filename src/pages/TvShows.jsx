import BrowsePage from '../components/BrowsePage';
import { TV_CATEGORIES } from '../lib/categories';

export default function TvShows() {
  return (
    <BrowsePage
      mediaType="tv"
      categories={TV_CATEGORIES}
      heroSource={{ kind: 'trending', window: 'week' }}
    />
  );
}
