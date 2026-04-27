import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientStats, getSessionHistory } from '../api/client';

export default function Profile() {
  const navigate = useNavigate();
  const player = JSON.parse(localStorage.getItem('player') || 'null');

  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!player) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        getPatientStats(player.patient_id),
        getSessionHistory(player.patient_id, 20),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
    setLoading(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (!player) return null;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-container max-w-4xl">
        {/* Profile Header */}
        <div className="glass-card p-8 mb-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-4xl shadow-xl shadow-primary-500/20">
              👤
            </div>

            {/* Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-bold text-slate-100">{stats?.name || player.name}</h1>
              <p className="text-slate-400 mt-1">Patient ID: <span className="text-primary-300">{player.patient_id}</span></p>
            </div>

            {/* Play button */}
            <button
              onClick={() => navigate('/game')}
              className="btn-game !px-8 !py-3"
            >
              🎮 Play
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: '🏆',
              value: stats?.high_score || 0,
              label: 'High Score',
              color: 'text-game-bird',
            },
            {
              icon: '🎮',
              value: stats?.total_sessions || 0,
              label: 'Total Sessions',
              color: 'text-primary-300',
            },
            {
              icon: '⏱️',
              value: formatDuration(stats?.total_play_time || 0),
              label: 'Total Playtime',
              color: 'text-green-400',
            },
            {
              icon: '📊',
              value: stats?.avg_score?.toFixed(1) || '0.0',
              label: 'Avg Score',
              color: 'text-purple-400',
            },
          ].map((stat, i) => (
            <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className={`stat-value ${stat.color}`}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Session History */}
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-slate-200">📋 Recent Sessions</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              No sessions recorded yet. Start playing to see your history!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left text-xs text-slate-500 uppercase tracking-wider py-3 px-6">Date</th>
                    <th className="text-center text-xs text-slate-500 uppercase tracking-wider py-3 px-4">Duration</th>
                    <th className="text-center text-xs text-slate-500 uppercase tracking-wider py-3 px-4">Score</th>
                    <th className="text-right text-xs text-slate-500 uppercase tracking-wider py-3 px-6">Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-800/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-6">
                        <div className="font-medium text-slate-300">{session.session_date}</div>
                        <div className="text-xs text-slate-500">{session.start_time}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">
                        {formatDuration(session.duration_seconds)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-lg font-bold text-primary-300">{session.score}</span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {session.score_improvement !== null && session.score_improvement !== undefined ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-lg text-sm font-medium ${
                              session.score_improvement > 0
                                ? 'bg-green-500/10 text-green-400'
                                : session.score_improvement < 0
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}
                          >
                            {session.score_improvement > 0 ? '↑' : session.score_improvement < 0 ? '↓' : '→'}{' '}
                            {Math.abs(session.score_improvement)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
