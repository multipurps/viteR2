import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGate from './components/AuthGate';
import SideNav from './components/SideNav';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TvShows from './pages/TvShows';
import TvDetail from './pages/TvDetail';
import MovieDetail from './pages/MovieDetail';
import Top10 from './pages/Top10';
import Networks from './pages/Networks';
import NetworkDetail from './pages/NetworkDetail';
import Search from './pages/Search';
import PairConfirm from './pages/PairConfirm';
import CategoryFull from './pages/CategoryFull';
import Watchlist from './pages/Watchlist';
import Rated from './pages/Rated';
import Profile from './pages/Profile';
import AiPicks from './pages/AiPicks';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AuthGate>
          <div className="app-shell">
            <SideNav />
            <MobileNav />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/tv" element={<TvShows />} />
                <Route path="/tv/:id" element={<TvDetail />} />
                <Route path="/movie/:id" element={<MovieDetail />} />
                <Route path="/top10" element={<Top10 />} />
                <Route path="/networks" element={<Networks />} />
                <Route path="/network/:id" element={<NetworkDetail />} />
                <Route path="/search" element={<Search />} />
                <Route path="/pair/:code" element={<PairConfirm />} />
                <Route path="/category/:mediaType/:slug" element={<CategoryFull />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/rated" element={<Rated />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/ai" element={<AiPicks />} />
              </Routes>
            </main>
          </div>
        </AuthGate>
      </HashRouter>
    </AuthProvider>
  );
}
