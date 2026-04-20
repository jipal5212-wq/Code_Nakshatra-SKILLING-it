import React, { useState } from 'react';

export default function CurriculumEngineWidget({ studentId, analyticsData, refreshData, setPhase }) {
  const [loading, setLoading] = useState(false);
  
  // Calculate current day based on progress (max 76)
  const currentDay = Math.min((analyticsData.total_lessons_completed || 0) + 1, 76);
  const isQuizDay = currentDay % 7 === 0;
  const isCapstoneDay = currentDay >= 67;

  const handleCompleteLesson = async () => {
    setLoading(true);
    try {
      await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          day_number: currentDay,
          video_watched_percent: 100,
          project_submitted: false
        })
      });
      await refreshData();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const dayTitles = [
    "Introduction to Cloud Architecture",
    "Deploying your first API",
    "Database Schemas & Modeling",
    "Authentication & Security",
    "Containerization with Docker",
    "CI/CD Pipelines",
    "Weekly Evaluation Quiz", // Day 7
  ];
  const title = isQuizDay ? "Weekly Evaluation Quiz" : dayTitles[(currentDay - 1) % 7] || "Advanced Engineering Topic";

  return (
    <div className="glass-panel p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none rounded-full"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <span className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Curriculum Engine</span>
          <h2 className="text-3xl font-headline font-black text-white mt-1">Day {currentDay} of 76</h2>
          <p className="text-on-surface-variant text-sm mt-1">{title}</p>
        </div>
        
        {/* Mentor Widget Mini */}
        {currentDay >= 1 && (
          <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/30">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
              JD
            </div>
            <div className="text-xs">
              <div className="text-white font-bold">John Doe</div>
              <div className="text-on-surface-variant text-[10px]">Your Mentor</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6 relative z-10">
        {!isQuizDay ? (
          <>
            <div className="aspect-video bg-surface-container-highest rounded-2xl flex items-center justify-center border border-outline-variant/20 relative group overflow-hidden">
              <span className="material-symbols-outlined text-6xl text-primary/40 group-hover:scale-110 transition-transform duration-500">play_circle</span>
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white font-bold">{title} (45 mins)</span>
              </div>
            </div>
            
            <button 
              onClick={handleCompleteLesson} 
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-black tracking-widest uppercase hover:shadow-[0_0_30px_rgba(161,250,255,0.4)] transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Mark Lesson Complete (+50 XP)'}
            </button>
          </>
        ) : (
          <div className="text-center py-12 bg-surface-container rounded-2xl border border-secondary/30">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4 border border-secondary/30">
              <span className="material-symbols-outlined text-4xl text-secondary">quiz</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Week {currentDay / 7} Evaluation</h3>
            <p className="text-on-surface-variant text-sm mb-6 max-w-sm mx-auto">Complete this quiz with &gt;70% to unlock next week's content, or &gt;86% for bonus materials.</p>
            <button 
              onClick={() => setPhase(8)} 
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-secondary to-tertiary text-on-secondary font-black tracking-widest uppercase hover:shadow-[0_0_30px_rgba(223,183,255,0.4)] transition-all"
            >
              Start Quiz
            </button>
          </div>
        )}

        {isCapstoneDay && (
          <div className="mt-8 p-6 bg-gradient-to-r from-tertiary/10 to-transparent border border-tertiary/30 rounded-2xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-tertiary">workspace_premium</span>
              <h3 className="font-bold text-white uppercase tracking-widest text-sm">Capstone Unlocked</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">You've reached Day 67! It's time to build your final Industry-Ready project.</p>
            <button className="text-xs text-tertiary hover:underline font-bold uppercase tracking-widest">
              View Capstone Brief &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
