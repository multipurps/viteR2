import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SideNav from './components/SideNav';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TvShows from './pages/TvShows';
import TvDetail from './pages/TvDetail';
import MovieDetail from './pages/MovieDetail';
import Top10 from './pages/Top10';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import AiPicks from './pages/AiPicks';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <SideNav />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TvShows />} />
            <Route path="/tv/:id" element={<TvDetail />} />
            <Route path="/movie/:id" element={<MovieDetail />} />
            <Route path="/top10" element={<Top10 />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/ai" element={<AiPicks />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
