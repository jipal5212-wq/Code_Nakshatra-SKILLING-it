import React from 'react';

export default function StreakTracker({ currentStreak = 0, longestStreak = 0, milestones = [] }) {
  const nextMilestone = milestones.find(m => !m.achieved) || milestones[milestones.length - 1];
  const progressPercent = nextMilestone ? Math.min(100, Math.round((currentStreak / nextMilestone.target_days) * 100)) : 100;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-primary/20">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-orange-400 text-xl">local_fire_department</span>
        </div>
        <div>
          <div className="text-2xl font-headline font-black text-white">{currentStreak}</div>
          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Day Streak</div>
        </div>
        {currentStreak > 0 && (
          <div className="ml-auto text-xs font-mono text-on-surface-variant">
            Best: <span className="text-primary font-bold">{longestStreak}</span>
          </div>
        )}
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && !nextMilestone.achieved && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">
            <span>Next: {nextMilestone.badge.replace(/_/g, ' ')}</span>
            <span>{currentStreak}/{nextMilestone.target_days} days</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] text-primary mt-1 text-right font-mono">+{nextMilestone.reward_xp} XP</div>
        </div>
      )}

      {/* Milestone dots */}
      <div className="flex justify-between items-center mt-4 px-1">
        {milestones.map((m, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
              m.achieved
                ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(161,250,255,0.4)]'
                : 'border-outline-variant text-outline-variant'
            }`}>
              <span className="material-symbols-outlined text-sm">
                {m.achieved ? 'check' : 'lock'}
              </span>
            </div>
            <span className={`text-[9px] font-bold tracking-widest ${m.achieved ? 'text-primary' : 'text-outline-variant'}`}>
              {m.target_days}d
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
