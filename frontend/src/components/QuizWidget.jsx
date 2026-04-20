import React, { useState, useEffect } from 'react';

export default function QuizWidget({ studentId, weekNumber, setPhase, refreshData }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quiz/${weekNumber}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data.questions || []);
        setLoading(false);
      })
      .catch(e => {
        console.error('Quiz fetch failed', e);
        setLoading(false);
      });
  }, [weekNumber]);

  const handleAnswer = (optIndex) => {
    const newAnswers = [...answers, optIndex];
    setAnswers(newAnswers);
    
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(c => c + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          week_number: weekNumber,
          answers: finalAnswers
        })
      });
      const data = await res.json();
      setResult(data);
      if (refreshData) await refreshData();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (loading && !result) {
    return <div className="text-center text-white p-12">Loading Evaluation...</div>;
  }

  if (result) {
    return (
      <div className="text-center space-y-8 animate-[fadeIn_0.5s_ease-out] py-8 w-full">
        <span className="material-symbols-outlined text-[80px] text-tertiary drop-shadow-[0_0_20px_rgba(251,219,94,0.6)]">verified</span>
        <h2 className="text-4xl font-headline font-black text-white">Evaluation Complete</h2>
        
        <div className="flex justify-center gap-12 py-8 border-y border-white/10">
          <div>
            <span className="block text-xs font-label text-on-surface-variant uppercase tracking-widest mb-2">Final Score</span>
            <span className="text-5xl font-mono font-bold text-white">
              {result.quiz_entry.score_percent}%
            </span>
          </div>
          <div>
            <span className="block text-xs font-label text-on-surface-variant uppercase tracking-widest mb-2">Rewards</span>
            <span className="text-5xl font-mono font-bold text-primary">+{result.xp_earned} XP</span>
          </div>
        </div>
        
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/30 mb-8">
          <h4 className="text-white font-bold mb-2">Curriculum Engine Result</h4>
          <p className="text-sm text-on-surface-variant">{result.message}</p>
          {result.unlocked_content && (
            <div className="mt-4 inline-block bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/30 text-xs font-bold uppercase tracking-widest">
              Unlocked: {result.unlocked_content.replace(/_/g, ' ')}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setPhase(4)}
          className="w-full py-5 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary font-black tracking-widest uppercase hover:shadow-[0_0_30px_rgba(161,250,255,0.4)] transition-all text-lg"
        >
          Claim Rewards & Return
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] w-full">
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <span className="text-primary font-mono tracking-widest text-sm uppercase">Evaluation Phase (Week {weekNumber})</span>
        <span className="bg-primary/10 text-primary font-bold px-4 py-1 rounded-full text-xs font-mono">
          Question {currentQuestion + 1} / {questions.length}
        </span>
      </div>
      
      <h3 className="text-3xl md:text-4xl font-headline font-bold text-white leading-tight">
        {questions[currentQuestion]?.q}
      </h3>
      
      <div className="grid gap-4 mt-8">
        {questions[currentQuestion]?.options.map((opt, idx) => (
          <button 
            key={idx}
            onClick={() => handleAnswer(idx)}
            className="w-full text-left p-6 rounded-xl bg-surface-container hover:bg-primary/10 border border-outline-variant hover:border-primary transition-all text-on-surface-variant hover:text-white font-body text-lg group flex items-center justify-between"
          >
            {opt}
            <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity text-primary">arrow_forward</span>
          </button>
        ))}
      </div>
    </div>
  );
}
