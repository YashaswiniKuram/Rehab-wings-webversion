import { useState, useEffect } from 'react';
import { getLeaderboard, getDailyStats } from '../api/client';

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_CLASSES = ['rank-gold', 'rank-silver', 'rank-bronze'];

export default function Leaderboard() {
  const [tab, setTab] = useState('scores');
  const [leaderboard, setLeaderboard] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lb, ds] = await Promise.all([
        getLeaderboard(20),
        getDailyStats(14),
      ]);
      setLeaderboard(lb.data);
      setDailyStats(ds.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
    setLoading(false);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="page-container">
      <div className="content-container max-w-4xl">
        <h1 className="section-title mb-2">🏆 Leaderboard</h1>
        <p className="text-slate-400 mb-8">See how you rank against other players</p>

        {/* Tabs */}
        <div className="flex bg-slate-800/60 rounded-xl p-1 mb-8 w-fit">
          {[
            { id: 'scores', label: '🎯 High Scores' },
            { id: 'daily', label: '📅 Daily Stats' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                tab === t.id
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          </div>
        ) : tab === 'scores' ? (
          /* High Scores */
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-5xl mb-4">🎮</div>
                <p className="text-slate-400 text-lg">No scores yet. Be the first to play!</p>
              </div>
            ) : (
              leaderboard.map((entry, idx) => (
                <div
                  key={entry.patient_id}
                  className="glass-card-hover flex items-center gap-4 p-4 sm:p-5 animate-slide-in-right"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${
                      idx < 3 ? RANK_CLASSES[idx] : 'bg-slate-700/60 text-slate-400'
                    }`}
                  >
                    {idx < 3 ? MEDALS[idx] : entry.rank}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{entry.name}</div>
                    <div className="text-sm text-slate-500">ID: {entry.patient_id}</div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-300">{entry.high_score}</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Points</div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Daily Stats */
          <div className="space-y-3">
            {dailyStats.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-slate-400 text-lg">No daily data available yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left text-xs text-slate-500 uppercase tracking-wider py-3 px-4">Date</th>
                      <th className="text-center text-xs text-slate-500 uppercase tracking-wider py-3 px-4">Players</th>
                      <th className="text-center text-xs text-slate-500 uppercase tracking-wider py-3 px-4">Sessions</th>
                      <th className="text-center text-xs text-slate-500 uppercase tracking-wider py-3 px-4">Playtime</th>
                      <th className="text-right text-xs text-slate-500 uppercase tracking-wider py-3 px-4">Best Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.map((day, idx) => (
                      <tr
                        key={day.play_date}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <td className="py-4 px-4 font-medium text-slate-300">{day.play_date}</td>
                        <td className="py-4 px-4 text-center text-slate-400">{day.active_players}</td>
                        <td className="py-4 px-4 text-center text-slate-400">{day.total_sessions}</td>
                        <td className="py-4 px-4 text-center text-slate-400">
                          {formatDuration(day.total_playtime_seconds)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-primary-300 font-bold">{day.best_session_score}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
