import React, { useState, useEffect } from 'react';

export default function PeerReviewWidget({ studentId, balance, setBalance }) {
  const [pendingProjects, setPendingProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [scores, setScores] = useState({ code_quality: 5, functionality: 5, creativity: 5, documentation: 5 });
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/projects/pending-review/${studentId}`)
      .then(res => res.json())
      .then(data => setPendingProjects(data.projects || []))
      .catch(e => console.error(e));
  }, [studentId, submitted]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.project_id,
          reviewer_id: studentId,
          ...scores,
          comments
        })
      });
      const data = await res.json();
      if (data.xp_earned) {
        setBalance(prev => prev + data.xp_earned);
        setSubmitted(true);
        setSelectedProject(null);
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!studentId) return null;

  return (
    <div className="glass-panel p-8 rounded-[2.5rem] border border-outline-variant/30">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-tertiary">rate_review</span>
          <h3 className="text-xl font-headline font-bold text-white">Peer Review Cycle</h3>
        </div>
        <span className="text-xs font-mono text-tertiary bg-tertiary/10 px-3 py-1 rounded-full border border-tertiary/20">
          +50 XP / Review
        </span>
      </div>

      {submitted && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          Review submitted! You earned 50 XP.
        </div>
      )}

      {!selectedProject ? (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant mb-4">Review your peers' projects to help them improve and earn XP.</p>
          {pendingProjects.length === 0 ? (
            <div className="text-center p-8 bg-surface-container rounded-xl border border-outline-variant/20">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">done_all</span>
              <p className="text-on-surface-variant">No pending projects to review right now.</p>
            </div>
          ) : (
            pendingProjects.map(p => (
              <div key={p.project_id} className="flex justify-between items-center p-4 bg-surface-container hover:bg-surface-container-high rounded-xl border border-outline-variant/20 transition-all">
                <div>
                  <div className="font-bold text-white text-sm">Project Submission</div>
                  <a href={p.github_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">link</span> {p.github_url}
                  </a>
                </div>
                <button onClick={() => setSelectedProject(p)} className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmitReview} className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-white">Reviewing Project</h4>
            <button type="button" onClick={() => setSelectedProject(null)} className="text-on-surface-variant hover:text-white text-sm">Cancel</button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {['code_quality', 'functionality', 'creativity', 'documentation'].map(cat => (
              <div key={cat} className="bg-surface-container p-4 rounded-xl border border-outline-variant/20">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                  {cat.replace('_', ' ')} (1-5)
                </label>
                <input 
                  type="range" min="1" max="5" 
                  value={scores[cat]} 
                  onChange={(e) => setScores({...scores, [cat]: e.target.value})}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                  <span>Needs Work</span>
                  <span className="text-primary font-bold text-sm">{scores[cat]}</span>
                  <span>Excellent</span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Constructive Feedback</label>
            <textarea 
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/30 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary/50 h-24"
              placeholder="What did they do well? What could be improved?"
              required
            />
          </div>

          <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-black tracking-widest uppercase hover:shadow-[0_0_30px_rgba(161,250,255,0.4)] transition-all">
            Submit Review & Earn 50 XP
          </button>
        </form>
      )}
    </div>
  );
}
