import React from 'react';

export default function WeeklyAnalytics({ analytics = {} }) {
  const {
    lessons_completed_this_week = 0,
    projects_deployed_this_week = 0,
    streak_status = 0,
    total_xp = 0,
    total_lessons_completed = 0,
  } = analytics;

  const stats = [
    { label: 'Lessons This Week', value: lessons_completed_this_week, icon: 'school', color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Projects Deployed', value: projects_deployed_this_week, icon: 'rocket_launch', color: 'text-secondary', bgColor: 'bg-secondary/10' },
    { label: 'Current Streak', value: `${streak_status}d`, icon: 'local_fire_department', color: 'text-orange-400', bgColor: 'bg-orange-400/10' },
    { label: 'Total XP', value: total_xp.toLocaleString(), icon: 'token', color: 'text-tertiary', bgColor: 'bg-tertiary/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-secondary">analytics</span>
        <h3 className="text-lg font-headline font-bold text-white uppercase tracking-widest text-sm">Weekly Summary</h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel rounded-xl p-5 border border-outline-variant/20 hover:border-primary/30 transition-all group">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
            </div>
            <div className="text-2xl font-headline font-black text-white">{stat.value}</div>
            <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="glass-panel rounded-xl p-5 border border-outline-variant/20">
        <div className="flex justify-between text-xs text-on-surface-variant uppercase tracking-widest mb-2">
          <span>76-Day Curriculum Progress</span>
          <span className="text-primary font-mono">{total_lessons_completed}/76</span>
        </div>
        <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full transition-all duration-1000"
            style={{ width: `${Math.round((total_lessons_completed / 76) * 100)}%` }}
          />
        </div>
        <div className="text-[10px] text-on-surface-variant mt-2 text-right">
          {Math.round((total_lessons_completed / 76) * 100)}% complete
        </div>
      </div>
    </div>
  );
}
