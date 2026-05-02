import React, { useState, useEffect } from 'react';

const MOCK_TASKS = [
  { id: 1, title: 'Build a Next.js Landing Page', category: 'Web Dev', xp: 50, diff: 'Beginner', duration: '1h' },
  { id: 2, title: 'Deploy a FastAPI Backend', category: 'AI & ML', xp: 80, diff: 'Intermediate', duration: '2h' },
  { id: 3, title: 'Setup GitHub Actions CI/CD', category: 'DevOps', xp: 60, diff: 'Intermediate', duration: '1.5h' },
  { id: 4, title: 'Create a Figma Wireframe', category: 'Design', xp: 40, diff: 'Beginner', duration: '45m' },
  { id: 5, title: 'Train a basic YOLO model', category: 'AI & ML', xp: 120, diff: 'Advanced', duration: '3h' },
  { id: 6, title: 'Write an SQL Query Optimizer', category: 'Data', xp: 90, diff: 'Advanced', duration: '2h' },
];

export default function CurriculumEngineWidget({ studentId, analyticsData, refreshData, setPhase }) {
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionLink, setSubmissionLink] = useState('');
  
  // Selection timer (2 hours)
  const [selectionTime, setSelectionTime] = useState(2 * 60 * 60);
  // Execution timer (24 hours)
  const [executionTime, setExecutionTime] = useState(24 * 60 * 60);

  useEffect(() => {
    let timer;
    if (!selectedTask && selectionTime > 0) {
      timer = setInterval(() => setSelectionTime(t => t - 1), 1000);
    } else if (selectedTask && !isSubmitted && executionTime > 0) {
      timer = setInterval(() => setExecutionTime(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [selectedTask, isSubmitted, selectionTime, executionTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submissionLink) return;
    setLoading(true);
    
    // Simulate API Call
    setTimeout(async () => {
      try {
        await fetch('/api/progress/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            day_number: 1,
            video_watched_percent: 100,
            project_submitted: true
          })
        });
        await refreshData();
      } catch (e) {
        console.error(e);
      }
      setIsSubmitted(true);
      setLoading(false);
    }, 1000);
  };

  if (isSubmitted) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-primary/20 relative overflow-hidden h-full flex flex-col items-center justify-center text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none rounded-full"></div>
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl text-emerald-400">task_alt</span>
        </div>
        <h2 className="text-3xl font-headline font-black text-white mb-2">Build Submitted!</h2>
        <p className="text-on-surface-variant text-sm max-w-md mb-8">
          Your project has been sent for peer review. You've earned +{selectedTask?.xp || 50} XP for maintaining your streak today. Check back tomorrow for a new pool of tasks.
        </p>
        <button 
          onClick={() => setPhase(6)} 
          className="px-8 py-3 rounded-xl bg-surface-container border border-outline-variant hover:bg-surface-container-highest transition-colors font-bold text-white text-sm tracking-widest uppercase"
        >
          Explore Tech News
        </button>
      </div>
    );
  }

  if (selectedTask) {
    return (
      <div className="glass-panel p-8 rounded-3xl border border-primary/20 relative overflow-hidden h-full flex flex-col">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] pointer-events-none rounded-full"></div>
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <span className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Active Execution Phase</span>
            <h2 className="text-3xl font-headline font-black text-white mt-1">{selectedTask.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase font-bold">{selectedTask.category}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/10 text-secondary uppercase font-bold">{selectedTask.diff}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block mb-1">Time Remaining</span>
            <span className="text-xl font-mono font-bold text-orange-400">{formatTime(executionTime)}</span>
          </div>
        </div>

        <div className="flex-1 relative z-10 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <div className="aspect-video bg-surface-container-highest rounded-2xl flex items-center justify-center border border-outline-variant/20 relative group overflow-hidden">
            <span className="material-symbols-outlined text-6xl text-primary/40 group-hover:scale-110 transition-transform duration-500">play_circle</span>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white font-bold">Watch Tutorial ({selectedTask.duration})</span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Proof of Work (URL)</label>
              <input 
                type="url" 
                required 
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                placeholder="https://github.com/... or Live Demo" 
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors text-sm"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !submissionLink}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-black tracking-widest uppercase hover:shadow-[0_0_30px_rgba(161,250,255,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
            >
              {loading ? 'Submitting...' : `Submit Build (+${selectedTask.xp} XP)`}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-3xl border border-primary/20 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[50px] pointer-events-none rounded-full"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <span className="text-secondary font-bold tracking-[0.2em] uppercase text-xs">Daily Task Pool</span>
          <h2 className="text-3xl font-headline font-black text-white mt-1">Select Your Build</h2>
          <p className="text-on-surface-variant text-sm mt-1">Choose one task to execute today. Choose wisely.</p>
        </div>
        <div className="text-right bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/20">
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block mb-1">Selection Closes In</span>
          <span className="text-lg font-mono font-bold text-white">{formatTime(selectionTime)}</span>
        </div>
      </div>

      <div className="flex-1 relative z-10 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {MOCK_TASKS.map((task) => (
          <div 
            key={task.id}
            onClick={() => handleSelectTask(task)}
            className="p-4 rounded-xl border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container hover:border-primary/40 cursor-pointer transition-all group flex items-center justify-between"
          >
            <div>
              <h3 className="font-bold text-white group-hover:text-primary transition-colors text-sm">{task.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant">{task.category}</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant">{task.diff}</span>
                <span className="text-[10px] px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">timer</span> {task.duration}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-primary font-bold text-sm block">+{task.xp} XP</span>
              <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-colors mt-1">arrow_forward</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
