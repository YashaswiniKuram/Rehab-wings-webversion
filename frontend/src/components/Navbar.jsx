import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const player = JSON.parse(localStorage.getItem('player') || 'null');

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/game', label: 'Play', icon: '🎮' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  ];

  if (player) {
    navLinks.push({ path: '/profile', label: 'Profile', icon: '👤' });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('player');
    navigate('/login');
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <span className="text-2xl group-hover:animate-bird-flap transition-transform">🐦</span>
            <span className="text-lg font-bold bg-gradient-to-r from-game-bird to-primary-400 bg-clip-text text-transparent hidden sm:block">
              Flappy Bird Rehab
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive(link.path)
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}

            {player ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-slate-700/50">
                <span className="text-sm text-slate-400">
                  Hi, <span className="text-primary-300 font-medium">{player.name}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm ml-4 !px-5 !py-2">
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 animate-slide-up">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="mr-3">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {player ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl"
              >
                🚪 Logout ({player.name})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-primary-300 bg-primary-500/10 rounded-xl"
              >
                🔑 Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
