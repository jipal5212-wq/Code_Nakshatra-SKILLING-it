import React from 'react';

const RANK_STYLES = {
  1: { bg: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-400/40', icon: '🥇', glow: 'shadow-[0_0_20px_rgba(251,219,94,0.2)]' },
  2: { bg: 'bg-gradient-to-r from-slate-300/10 to-slate-400/5', border: 'border-slate-300/30', icon: '🥈', glow: '' },
  3: { bg: 'bg-gradient-to-r from-amber-700/10 to-amber-800/5', border: 'border-amber-600/30', icon: '🥉', glow: '' },
};

export default function LeaderboardWidget({ leaderboard = [], currentStudentId = null }) {
  if (leaderboard.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">leaderboard</span>
        <p className="text-on-surface-variant">Leaderboard populates as students join!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">leaderboard</span>
          <h3 className="text-lg font-headline font-bold text-white uppercase tracking-widest text-sm">Leaderboard</h3>
        </div>
        <span className="text-xs text-on-surface-variant font-mono">{leaderboard.length} students</span>
      </div>

      <div className="space-y-3">
        {leaderboard.slice(0, 10).map((entry) => {
          const rs = RANK_STYLES[entry.rank] || {};
          const isCurrentUser = entry.student_id === currentStudentId;
          return (
            <div
              key={entry.student_id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                isCurrentUser
                  ? 'bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(161,250,255,0.15)]'
                  : rs.bg || 'bg-surface-container'
              } ${rs.border || 'border-outline-variant/20'} ${rs.glow}`}
            >
              {/* Rank */}
              <div className="w-10 text-center flex-shrink-0">
                {entry.rank <= 3 ? (
                  <span className="text-2xl">{rs.icon}</span>
                ) : (
                  <span className="text-lg font-headline font-bold text-on-surface-variant">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCurrentUser ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                }`}>
                  {entry.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-bold truncate ${isCurrentUser ? 'text-primary' : 'text-white'}`}>
                    {entry.name} {isCurrentUser && <span className="text-[10px] text-primary/70">(You)</span>}
                  </div>
                  <div className="text-[10px] text-on-surface-variant flex gap-3">
                    <span>🔥 {entry.streak_days}d</span>
                    <span>🏆 {entry.badges.length}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-on-surface-variant">XP</div>
                  <div className="text-sm font-mono font-bold text-primary">{entry.xp_points.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-on-surface-variant">Score</div>
                  <div className="text-sm font-mono font-bold text-white">{entry.score}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
