import React from 'react';

const BADGE_STYLES = {
  legendary: { border: 'border-yellow-400/50', bg: 'bg-yellow-400/10', text: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(251,219,94,0.3)]' },
  epic: { border: 'border-purple-400/50', bg: 'bg-purple-400/10', text: 'text-purple-400', glow: 'shadow-[0_0_15px_rgba(192,132,252,0.3)]' },
  rare: { border: 'border-cyan-400/50', bg: 'bg-cyan-400/10', text: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(161,250,255,0.3)]' },
};

const BADGE_ICONS = {
  on_fire: 'local_fire_department',
  unstoppable: 'rocket_launch',
  month_master: 'military_tech',
  industry_ready_builder: 'workspace_premium',
};

export default function BadgeShowcase({ badges = [] }) {
  if (badges.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 block">emoji_events</span>
        <p className="text-on-surface-variant text-sm">Complete tasks to earn badges!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-tertiary">emoji_events</span>
        <h3 className="text-lg font-headline font-bold text-white uppercase tracking-widest text-sm">Badges Earned</h3>
        <span className="text-xs font-mono text-tertiary bg-tertiary/10 px-3 py-1 rounded-full border border-tertiary/20">{badges.length}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge, i) => {
          const style = BADGE_STYLES[badge.rarity] || BADGE_STYLES.rare;
          const icon = BADGE_ICONS[badge.badge_name] || 'verified';
          return (
            <div
              key={badge.badge_id || i}
              className={`glass-panel rounded-2xl p-5 border ${style.border} ${style.glow} text-center group hover:scale-105 transition-all duration-300 cursor-default`}
            >
              <div className={`w-14 h-14 rounded-full ${style.bg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <span className={`material-symbols-outlined text-2xl ${style.text}`}>{icon}</span>
              </div>
              <h4 className={`text-xs font-black uppercase tracking-widest ${style.text} mb-1`}>
                {badge.badge_name.replace(/_/g, ' ')}
              </h4>
              <p className="text-[10px] text-on-surface-variant">{badge.description}</p>
              <div className={`mt-2 text-[9px] uppercase tracking-widest font-bold ${style.text} opacity-70`}>
                {badge.rarity}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
