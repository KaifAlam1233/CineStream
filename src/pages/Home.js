import React, { useState, useEffect, useCallback } from 'react';
import './Home.css';

const API_KEY = process.env.REACT_APP_OMDB_KEY;
const BASE_URL = 'https://www.omdbapi.com/';

// ── helpers ──────────────────────────────────────────────────────────────────
const fetchMovies = async (query, page = 1, type = 'movie') => {
  const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=${type}&page=${page}`);
  return res.json();
};
const fetchDetail = async (imdbID) => {
  const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
  return res.json();
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-poster shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line shimmer" style={{ width: '80%' }} />
        <div className="skeleton-line shimmer" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

// ── Movie card ────────────────────────────────────────────────────────────────
function MovieCard({ movie, onClick, onFav, isFav }) {
  const hasPoster = movie.Poster && movie.Poster !== 'N/A';
  return (
    <div className="movie-card" onClick={onClick}>
      {hasPoster
        ? <img className="movie-poster" src={movie.Poster} alt={movie.Title} loading="lazy" />
        : <div className="poster-placeholder"><span>🎬</span><p>No Poster</p></div>}
      <button
        className={`fav-btn ${isFav ? 'fav-active' : ''}`}
        onClick={e => { e.stopPropagation(); onFav(movie); }}
        title={isFav ? 'Remove from Watchlist' : 'Add to Watchlist'}
      >
        {isFav ? '❤️' : '🤍'}
      </button>
      <div className="movie-overlay"><span className="watch-btn">▶ Watch</span></div>
      <div className="movie-info">
        <p className="movie-title">{movie.Title}</p>
        <div className="movie-meta">
          <span>{movie.Year}</span>
          <span className="movie-type">{movie.Type}</span>
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ movie, onClose }) {
  const [tab, setTab] = useState('watch');
  const hasPoster = movie.Poster && movie.Poster !== 'N/A';
  const playerUrl = `https://streamimdb.ru/embed/movie/${movie.imdbID}`;
  const trailerUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.Title + ' ' + movie.Year + ' official trailer')}`;
  const imdbUrl = `https://www.imdb.com/title/${movie.imdbID}/`;

  return (
    <div className="modal-overlay" onClick={e => e.target.className === 'modal-overlay' && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-tabs">
          <button className={tab === 'watch' ? 'mtab active' : 'mtab'} onClick={() => setTab('watch')}>▶ Watch Movie</button>
          <button className={tab === 'trailer' ? 'mtab active' : 'mtab'} onClick={() => setTab('trailer')}>🎭 Trailer</button>
        </div>
        <div className="player-wrap">
          {tab === 'watch'
            ? <iframe src={playerUrl} allowFullScreen allow="autoplay; fullscreen" title={movie.Title} />
            : <iframe
                src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movie.Title + ' ' + movie.Year + ' official trailer')}`}
                allowFullScreen allow="autoplay; fullscreen" title="Trailer"
              />
          }
        </div>
        <div className="modal-info">
          {hasPoster && <img className="modal-poster" src={movie.Poster} alt={movie.Title} />}
          <div className="modal-text">
            <h2 className="modal-title">{movie.Title}</h2>
            <div className="modal-tags">
              {[movie.Year, movie.Rated, movie.Runtime, ...(movie.Genre || '').split(', ').slice(0, 2)]
                .filter(t => t && t !== 'N/A')
                .map((t, i) => <span key={i} className="modal-tag">{t}</span>)}
            </div>
            {movie.imdbRating !== 'N/A' && <p className="modal-rating">⭐ {movie.imdbRating}/10 IMDb</p>}
            {movie.Director && movie.Director !== 'N/A' && <p className="modal-director">🎬 {movie.Director}</p>}
            {movie.Actors && movie.Actors !== 'N/A' && <p className="modal-actors">🎭 {movie.Actors}</p>}
            <p className="modal-plot">{movie.Plot}</p>
          </div>
        </div>
        <div className="modal-actions">
          <a href={trailerUrl} target="_blank" rel="noreferrer" className="btn-trailer">🎭 YouTube Trailer</a>
          <a href={imdbUrl} target="_blank" rel="noreferrer" className="btn-imdb">⭐ IMDb</a>
        </div>
      </div>
    </div>
  );
}

// ── Install Prompt ────────────────────────────────────────────────────────────
function InstallBanner({ onDismiss, onInstall }) {
  return (
    <div className="install-banner">
      <div className="install-left">
        <span className="install-icon">🎬</span>
        <div>
          <p className="install-title">Install CineStream App</p>
          <p className="install-sub">Watch movies anytime — even offline!</p>
        </div>
      </div>
      <div className="install-actions">
        <button className="btn-install" onClick={onInstall}>Install</button>
        <button className="btn-dismiss" onClick={onDismiss}>✕</button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [bollywood, setBollywood] = useState([]);
  const [hollywood, setHollywood] = useState([]);
  const [southIndian, setSouthIndian] = useState([]);
const [webSeries, setWebSeries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skeletonVisible, setSkeletonVisible] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [genre, setGenre] = useState('All');
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('cs_favs') || '[]'));
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [activeRegion, setActiveRegion] = useState(null);

  const GENRES = ['All', 'Action', 'Comedy', 'Horror', 'Drama', 'Romance', 'Thriller', 'Sci-Fi', 'Animation'];

  useEffect(() => {
    const handler = e => { e.preventDefault(); setInstallPrompt(e); setShowInstall(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    loadHomeSections();
  }, []);

  const loadHomeSections = async () => {
    setSkeletonVisible(true);
    try {
      const trendingTerms = ['Avengers', 'Inception', 'Interstellar'];
      const tAll = [];
      for (const t of trendingTerms) {
        const d = await fetchMovies(t);
        if (d.Response === 'True') tAll.push(...d.Search.slice(0, 3));
      }
      setTrending(tAll.slice(0, 9));

      const trTerms = ['Godfather', 'Dark Knight', 'Schindler'];
      const trAll = [];
      for (const t of trTerms) {
        const d = await fetchMovies(t);
        if (d.Response === 'True') trAll.push(...d.Search.slice(0, 3));
      }
      setTopRated(trAll.slice(0, 9));

      const bTerms = ['Dilwale', 'Dangal', 'Kabir Singh'];
      const bAll = [];
      for (const t of bTerms) {
        const d = await fetchMovies(t);
        if (d.Response === 'True') bAll.push(...d.Search.slice(0, 3));
      }
      setBollywood(bAll.slice(0, 9));

      const hTerms = ['Spider-Man', 'Fast Furious', 'Mission Impossible'];
      const hAll = [];
      for (const t of hTerms) {
        const d = await fetchMovies(t);
        if (d.Response === 'True') hAll.push(...d.Search.slice(0, 3));
      }
      setHollywood(hAll.slice(0, 9));

      const sTerms = ['KGF', 'Pushpa', 'RRR'];
      const sAll = [];
      for (const t of sTerms) {
        const d = await fetchMovies(t);
        if (d.Response === 'True') sAll.push(...d.Search.slice(0, 3));
      }
      setSouthIndian(sAll.slice(0, 9));
      const wsTerms = ['Breaking Bad', 'Money Heist', 'Mirzapur'];
const wsAll = [];
for (const t of wsTerms) {
  const d = await fetchMovies(t, 1, 'series');
  if (d.Response === 'True') wsAll.push(...d.Search.slice(0, 3));
}
setWebSeries(wsAll.slice(0, 9));
    } catch (e) { console.error(e); }
    setSkeletonVisible(false);
  };

  const searchMovies = useCallback(async (q = query, p = 1, g = genre) => {
    if (!q.trim()) return;
    setLoading(true);
    setActiveSection('search');
    let searchQ = q;
    if (g !== 'All') searchQ = `${q} ${g}`;
    const data = await fetchMovies(searchQ, p);
    if (data.Response === 'True') {
      setMovies(p === 1 ? data.Search : prev => [...prev, ...data.Search]);
      setTotalResults(parseInt(data.totalResults));
    } else {
      setMovies([]);
      setTotalResults(0);
    }
    setPage(p);
    setLoading(false);
  }, [query, genre]);

  const searchRegion = (region) => {
    setActiveSection('region');
    setActiveRegion(region);
    setMovies([]);
  };

  const regionSearch = async (term, p = 1, type = 'movie') => {
    setLoading(true);
    setQuery(term);
    const data = await fetchMovies(term, p, type);
    if (data.Response === 'True') {
      setMovies(p === 1 ? data.Search : prev => [...prev, ...data.Search]);
      setTotalResults(parseInt(data.totalResults));
    } else { setMovies([]); setTotalResults(0); }
    setPage(p);
    setLoading(false);
  };

  const openMovie = async (imdbID) => {
    const data = await fetchDetail(imdbID);
    setSelected(data);
  };

  const toggleFav = (movie) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.imdbID === movie.imdbID);
      const updated = exists ? prev.filter(f => f.imdbID !== movie.imdbID) : [...prev, movie];
      localStorage.setItem('cs_favs', JSON.stringify(updated));
      return updated;
    });
  };

  const isFav = (id) => favorites.some(f => f.imdbID === id);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
  };

  const goHome = () => {
    setActiveSection('home');
    setMovies([]);
    setQuery('');
    setActiveRegion(null);
  };

  const renderGrid = (list, emptyMsg = 'No movies found.') => (
    skeletonVisible
      ? <div className="movies-grid">{Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
      : list.length === 0
        ? <p className="no-results">{emptyMsg}</p>
        : <div className="movies-grid">
          {list.map(m => (
            <MovieCard key={m.imdbID} movie={m} onClick={() => openMovie(m.imdbID)} onFav={toggleFav} isFav={isFav(m.imdbID)} />
          ))}
        </div>
  );

  return (
    <div className="home">
      {showInstall && <InstallBanner onDismiss={() => setShowInstall(false)} onInstall={handleInstall} />}

<nav className="navbar">
        <span className="logo" onClick={goHome} style={{ cursor: 'pointer' }}>Cine<span>Stream</span></span>
        <div className="nav-links">
          <button className={`nav-btn ${activeSection === 'home' ? 'nav-active' : ''}`} onClick={goHome}>🏠 Home</button>
          <button className={`nav-btn ${activeSection === 'region' && activeRegion === 'bollywood' ? 'nav-active' : ''}`} onClick={() => searchRegion('bollywood')}>🎵 Bollywood</button>
          <button className={`nav-btn ${activeSection === 'region' && activeRegion === 'hollywood' ? 'nav-active' : ''}`} onClick={() => searchRegion('hollywood')}>🎬 Hollywood</button>
          <button className={`nav-btn ${activeSection === 'region' && activeRegion === 'south' ? 'nav-active' : ''}`} onClick={() => searchRegion('south')}>🌴 South Indian</button>
          <button className={`nav-btn ${activeSection === 'watchlist' ? 'nav-active' : ''}`} onClick={() => setActiveSection('watchlist')}>❤️ Watchlist <span className="fav-count">{favorites.length}</span></button>
          <button className={`nav-btn ${activeSection === 'webseries' ? 'nav-active' : ''}`} onClick={() => setActiveSection('webseries')}>📺 Web Series</button>
        </div>
      </nav>

      {activeSection === 'home' && (
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <div className="hero-badge">🎬 Free Movie Streaming</div>
            <h1 className="hero-title">Watch Any<br /><span>Movie Free</span></h1>
            <p className="hero-sub">Search millions of movies. Stream instantly — no signup required.</p>
            <div className="search-wrap">
              <input
                type="text" className="search-box" placeholder="Search movies..."
                value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchMovies()}
              />
              <button className="search-btn" onClick={() => searchMovies()}>Search</button>
            </div>
            <div className="popular-tags">
              <span>Popular:</span>
              {['Avengers', 'Inception', 'Interstellar', 'The Dark Knight', 'Pushpa', 'KGF'].map(t => (
                <span key={t} className="pop-tag" onClick={() => { setQuery(t); searchMovies(t); }}>{t}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeSection !== 'home' && (
        <div className="top-search-bar">
          <input
            type="text" className="search-box-top" placeholder="Search movies..."
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchMovies()}
          />
          <button className="search-btn" onClick={() => searchMovies()}>Search</button>
        </div>
      )}

      {activeSection === 'search' && (
        <div className="genre-bar">
          {GENRES.map(g => (
            <button key={g} className={`genre-btn ${genre === g ? 'genre-active' : ''}`}
              onClick={() => { setGenre(g); searchMovies(query, 1, g); }}>{g}</button>
          ))}
        </div>
      )}

      <main className="main-content">
        {activeSection === 'search' && (
          <section className="results-section">
            <h2 className="section-title">Results for "<span>{query}</span>" {genre !== 'All' && `· ${genre}`}</h2>
            {loading && page === 1
              ? <div className="movies-grid">{Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
              : renderGrid(movies, 'No movies found. Try a different search.')}
            {movies.length > 0 && movies.length < totalResults && (
              <div className="load-more-wrap">
                <button className="load-more-btn" onClick={() => searchMovies(query, page + 1, genre)} disabled={loading}>
                  {loading ? 'Loading...' : `Load More (${totalResults - movies.length} left)`}
                </button>
              </div>
            )}
          </section>
        )}
{activeSection === 'webseries' && (
  <section className="results-section">
    <div className="region-header">
      <h2 className="section-title">📺 Web Series & Shows</h2>
      <div className="region-tags">
        {['Breaking Bad', 'Money Heist', 'Mirzapur', 'Sacred Games', 'Stranger Things', 'Game of Thrones', 'The Family Man', 'Panchayat'].map(t => (
          <span key={t} className="pop-tag" onClick={() => regionSearch(t, 1, 'series')}>{t}</span>
        ))}
      </div>
    </div>
    {loading
      ? <div className="movies-grid">{Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
      : movies.length > 0 ? renderGrid(movies) : renderGrid(webSeries)}
    {movies.length > 0 && movies.length < totalResults && (
      <div className="load-more-wrap">
        <button className="load-more-btn" onClick={() => regionSearch(query, page + 1, 'series')} disabled={loading}>
          {loading ? 'Loading...' : `Load More (${totalResults - movies.length} left)`}
        </button>
      </div>
    )}
  </section>
)}
        {activeSection === 'watchlist' && (
          <section className="results-section">
            <h2 className="section-title">❤️ My Watchlist</h2>
            {renderGrid(favorites, 'No movies saved yet. Click 🤍 on any movie to save it!')}
          </section>
        )}

        {activeSection === 'region' && activeRegion === 'bollywood' && (
          <section className="results-section">
            <div className="region-header">
              <h2 className="section-title">🎵 Bollywood Movies</h2>
              <div className="region-tags">
                {['Dilwale', 'Dangal', 'Kabir Singh', 'Brahmastra', 'Pathaan', 'Animal', '3 Idiots', 'PK'].map(t => (
                  <span key={t} className="pop-tag" onClick={() => regionSearch(t)}>{t}</span>
                ))}
              </div>
            </div>
            {loading
              ? <div className="movies-grid">{Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
              : movies.length > 0 ? renderGrid(movies) : renderGrid(bollywood)}
            {movies.length > 0 && movies.length < totalResults && (
              <div className="load-more-wrap">
                <button className="load-more-btn" onClick={() => regionSearch(query, page + 1)} disabled={loading}>
                  {loading ? 'Loading...' : `Load More (${totalResults - movies.length} left)`}
                </button>
              </div>
            )}
          </section>
        )}

        {activeSection === 'region' && activeRegion === 'hollywood' && (
          <section className="results-section">
            <div className="region-header">
              <h2 className="section-title">🎬 Hollywood Movies</h2>
              <div className="region-tags">
                {['Avengers', 'Spider-Man', 'Batman', 'Iron Man', 'Fast Furious', 'Transformers', 'Jurassic Park'].map(t => (
                  <span key={t} className="pop-tag" onClick={() => regionSearch(t)}>{t}</span>
                ))}
              </div>
            </div>
            {loading
              ? <div className="movies-grid">{Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
              : movies.length > 0 ? renderGrid(movies) : renderGrid(hollywood)}
          </section>
        )}

        {activeSection === 'region' && activeRegion === 'south' && (
          <section className="results-section">
            <div className="region-header">
              <h2 className="section-title">🌴 South Indian Movies</h2>
              <div className="region-tags">
                {['KGF', 'Pushpa', 'RRR', 'Baahubali', 'Vikram', 'Salaar', 'Leo', 'Jailer'].map(t => (
                  <span key={t} className="pop-tag" onClick={() => regionSearch(t)}>{t}</span>
                ))}
              </div>
            </div>
            {loading
              ? <div className="movies-grid">{Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div>
              : movies.length > 0 ? renderGrid(movies) : renderGrid(southIndian)}
          </section>
        )}

        {activeSection === 'home' && (
          <>
            <section className="results-section">
              <h2 className="section-title">🔥 Trending Now</h2>
              {renderGrid(trending)}
            </section>
            <section className="results-section">
              <h2 className="section-title">⭐ Top Rated</h2>
              {renderGrid(topRated)}
            </section>
            <section className="results-section">
              <div className="section-row">
                <h2 className="section-title">🎵 Bollywood</h2>
                <button className="see-all-btn" onClick={() => searchRegion('bollywood')}>See All →</button>
              </div>
              {renderGrid(bollywood)}
            </section>
            <section className="results-section">
              <div className="section-row">
                <h2 className="section-title">🎬 Hollywood</h2>
                <button className="see-all-btn" onClick={() => searchRegion('hollywood')}>See All →</button>
              </div>
              {renderGrid(hollywood)}
            </section>
            <section className="results-section">
              <div className="section-row">
                <h2 className="section-title">🌴 South Indian</h2>
                <button className="see-all-btn" onClick={() => searchRegion('south')}>See All →</button>
              </div>
              {renderGrid(southIndian)}
            </section><section className="results-section">
  <div className="section-row">
    <h2 className="section-title">📺 Web Series</h2>
    <button className="see-all-btn" onClick={() => setActiveSection('webseries')}>See All →</button>
  </div>
  {renderGrid(webSeries)}
</section>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-logo">Cine<span>Stream</span></div>
        <p className="footer-text">Free movie streaming — no signup required.</p>
        <p className="footer-credit">Made with ❤️ by <strong>Md Kaif Alam</strong></p>
        <p className="footer-disclaimer">CineStream does not host any video content. All streams are provided by third-party services.</p>
      </footer>

      {selected && <Modal movie={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}