import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSeason, IMG } from '../lib/tmdb';
import { upsertProgress, removeFromContinue } from '../lib/supabase';
import './Player.css';

// ── Embed sources — same providers/URL patterns as the legacy player ──
// SuperEmbed (multiembed.mov) was unreliable and has been dropped in
// favor of EmbedSU. This is the desktop/TV order; mobile gets its own
// order below (VidLink last there — it's slower to load on mobile).
const BASE_SERVERS = [
  { n: 'VidLink', f: (id, t, s, e) => (t === 'tv' ? `https://vidlink.pro/tv/${id}/${s || 1}/${e || 1}` : `https://vidlink.pro/movie/${id}`) },
  { n: 'VidSrc', f: (id, t, s, e) => (t === 'tv' ? `https://vidsrc.to/embed/tv/${id}/${s || 1}/${e || 1}` : `https://vidsrc.to/embed/movie/${id}`) },
  { n: 'AutoEmbed', f: (id, t, s, e) => (t === 'tv' ? `https://autoembed.co/tv/tmdb/${id}-${s || 1}-${e || 1}` : `https://autoembed.co/movie/tmdb/${id}`) },
  { n: '2Embed', f: (id, t, s, e) => (t === 'tv' ? `https://www.2embed.cc/embedtv/${id}&s=${s || 1}&e=${e || 1}` : `https://www.2embed.cc/embed/${id}`) },
  { n: 'EmbedSU', f: (id, t, s, e) => (t === 'tv' ? `https://embed.su/embed/tv/${id}/${s || 1}/${e || 1}` : `https://embed.su/embed/movie/${id}`) },
];

// Mobile-only order: 2Embed, AutoEmbed, VidSrc, VidLink, then EmbedSU.
// Detected by actual touch capability, not screen width — a width
// check would risk misfiring on TV browsers, which have already shown
// they can misreport their viewport size.
const MOBILE_ORDER = ['2Embed', 'AutoEmbed', 'VidSrc', 'VidLink', 'EmbedSU'];

function getServers() {
  const isMobile = typeof window !== 'undefined'
    && window.matchMedia?.('(hover: none) and (pointer: coarse)').matches;
  if (!isMobile) return BASE_SERVERS;
  return MOBILE_ORDER.map((name) => BASE_SERVERS.find((s) => s.n === name)).filter(Boolean);
}

export default function Player({ item, mediaType, initialSeason = 1, initialEpisode = 1, onClose }) {
  const { user } = useAuth();
  const isTv = mediaType === 'tv';
  const title = item.title || item.name;
  const SERVERS = useMemo(getServers, []);

  const [serverIdx, setServerIdx] = useState(0);
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [episodes, setEpisodes] = useState([]);
  const [fsPanelOpen, setFsPanelOpen] = useState(false);
  const [epPanelOpen, setEpPanelOpen] = useState(false);

  const fsPanelRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const progressRef = useRef(0);
  const lastTickRef = useRef(Date.now());
  const saveTimerRef = useRef(null);

  // Load the episode list whenever the season changes (TV only)
  useEffect(() => {
    if (!isTv) return;
    let cancelled = false;
    getSeason(item.id, season)
      .then((d) => { if (!cancelled) setEpisodes(d.episodes || []); })
      .catch(() => { if (!cancelled) setEpisodes([]); });
    return () => { cancelled = true; };
  }, [isTv, item.id, season]);

  // Close the floating server panel on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (
        fsPanelOpen &&
        fsPanelRef.current &&
        !fsPanelRef.current.contains(e.target) &&
        !toggleBtnRef.current?.contains(e.target)
      ) {
        setFsPanelOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [fsPanelOpen]);

  // Exiting fullscreen closes both floating panels
  useEffect(() => {
    function onFsChange() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setFsPanelOpen(false);
        setEpPanelOpen(false);
      }
    }
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Continue-watching: estimate progress from time elapsed since last tick
  // (embeds don't expose real playback position across origins), save every 30s.
  useEffect(() => {
    if (!user) return undefined;
    progressRef.current = 0;
    lastTickRef.current = Date.now();

    const runtime = item.runtime || item.episode_run_time?.[0] || 90;

    const save = () => {
      const now = Date.now();
      const deltaMinutes = (now - lastTickRef.current) / 60000;
      lastTickRef.current = now;
      const deltaPct = (Math.min(deltaMinutes, 1.5) / runtime) * 100;
      progressRef.current = Math.min(progressRef.current + deltaPct, 99);

      if (progressRef.current >= 99) {
        removeFromContinue(user.id, item.id, mediaType).catch(() => {});
        return;
      }
      upsertProgress(user.id, mediaType, item, Math.round(progressRef.current), isTv ? season : null, isTv ? episode : null).catch(() => {});
    };

    save();
    saveTimerRef.current = setInterval(save, 30000);
    return () => clearInterval(saveTimerRef.current);
  }, [user, item, mediaType, season, episode, isTv]);

  const src = SERVERS[serverIdx].f(item.id, mediaType, season, episode);

  function chooseServer(i) {
    setServerIdx(i);
    setFsPanelOpen(false);
  }

  function chooseEpisode(ep) {
    setEpisode(ep.episode_number);
    setEpPanelOpen(false);
  }

  return (
    <div className="pl-modal">
      <div className="pl-top">
        <button className="pl-close" onClick={onClose} aria-label="Close player">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <span className="pl-title">{title}{isTv ? ` · S${season} · E${episode}` : ''}</span>
        {isTv && (
          <button className="pl-ep-toggle" onClick={() => setEpPanelOpen((v) => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            Episodes
          </button>
        )}
      </div>

      <div className="pl-wrap">
        <iframe
          key={src}
          className="pl-iframe"
          src={src}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          title={title}
        />

        {/* Floating server button — only shown in fullscreen (see Player.css) */}
        <button ref={toggleBtnRef} className="pl-srv-toggle" onClick={() => setFsPanelOpen((v) => !v)} title="Change Server">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
        </button>

        {/* Floating server picker panel */}
        <div ref={fsPanelRef} className={`pl-srv-fs-panel${fsPanelOpen ? ' open' : ''}`}>
          {SERVERS.map((s, i) => (
            <button key={s.n} className={`pl-srv-fs-btn${i === serverIdx ? ' on' : ''}`} onClick={() => chooseServer(i)}>
              {s.n}
            </button>
          ))}
        </div>

        {/* Episode side panel (TV only) */}
        {isTv && (
          <>
            <div className={`pl-ep-backdrop${epPanelOpen ? ' open' : ''}`} onClick={() => setEpPanelOpen(false)} />
            <div className={`pl-ep-panel${epPanelOpen ? ' open' : ''}`}>
              <div className="pl-ep-panel-hd">
                <div>
                  <div className="pl-ep-panel-title">{title}</div>
                  <div className="pl-ep-panel-season">Season {season}</div>
                </div>
                <select
                  className="pl-ep-panel-sel"
                  value={season}
                  onChange={(e) => setSeason(Number(e.target.value))}
                >
                  {(item.seasons || []).filter((s) => s.season_number > 0).map((s) => (
                    <option key={s.id} value={s.season_number}>{s.name}</option>
                  ))}
                </select>
                <button className="pl-ep-panel-close" onClick={() => setEpPanelOpen(false)} aria-label="Close episodes">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="pl-ep-panel-list">
                {episodes.map((ep) => (
                  <button
                    key={ep.id}
                    className={`pl-ep-row${ep.episode_number === episode ? ' on' : ''}`}
                    onClick={() => chooseEpisode(ep)}
                  >
                    <img src={IMG(ep.still_path, 'w300') || IMG(item.backdrop_path, 'w300')} alt={ep.name} loading="lazy" />
                    <div className="pl-ep-row-info">
                      <span className="pl-ep-row-num">E{ep.episode_number}</span>
                      <span className="pl-ep-row-name">{ep.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Server bar — hidden in fullscreen (see Player.css), floating button/panel take over */}
      <div className="pl-srv-bar">
        {SERVERS.map((s, i) => (
          <button key={s.n} className={`pl-srv-btn${i === serverIdx ? ' on' : ''}`} onClick={() => chooseServer(i)}>
            {s.n}
          </button>
        ))}
      </div>
    </div>
  );
}
