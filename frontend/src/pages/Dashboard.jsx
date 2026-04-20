import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import LeaderboardWidget from '../components/LeaderboardWidget';
import StreakTracker from '../components/StreakTracker';
import BadgeShowcase from '../components/BadgeShowcase';
import WeeklyAnalytics from '../components/WeeklyAnalytics';
import PeerReviewWidget from '../components/PeerReviewWidget';
import CurriculumEngineWidget from '../components/CurriculumEngineWidget';
import QuizWidget from '../components/QuizWidget';

const API_BASE = '/api';

export default function Dashboard() {
  const [phase, setPhase] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(24 * 60 * 60 - 1);
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [balance, setBalance] = useState(0);
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [streakData, setStreakData] = useState({ current_streak: 0, longest_streak: 0, milestones: [] });
  const [badgesData, setBadgesData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({});


  const fetchData = async () => {
    if (!studentId) return;
    try {
      const [lbRes, stRes, bdRes, anRes] = await Promise.all([
        fetch(`${API_BASE}/leaderboard`).then(r => r.json()),
        fetch(`${API_BASE}/streak/${studentId}`).then(r => r.json()),
        fetch(`${API_BASE}/badges/${studentId}`).then(r => r.json()),
        fetch(`${API_BASE}/analytics/${studentId}/weekly`).then(r => r.json()),
      ]);
      setLeaderboard(lbRes.leaderboard || []);
      setStreakData(stRes);
      setBadgesData(bdRes.badges || []);
      setAnalyticsData(anRes);
      setBalance(anRes.total_xp || 0);
    } catch (e) { console.log('API not available, using local state'); }
  };

  useEffect(() => {
    fetchData();
  }, [studentId, balance]);




  useEffect(() => {
    let timer;
    if (isSprintActive && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isSprintActive, countdown]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleStartSprint = () => {
    setPhase(4.5); // transition for reveal
    setTimeout(() => {
      setPhase(5);
      setIsSprintActive(true);
    }, 3000);
  };

  const handleRegister = async (email, name) => {
    try {
      const res = await fetch(`${API_BASE}/students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (data.student) {
        setStudentId(data.student.student_id);
        setStudentName(data.student.name);
      }
    } catch (e) {
      console.log('API not available, continuing locally');
      setStudentId('local-' + Date.now());
      setStudentName(name || 'Student');
    }
    setIsModalOpen(false);
    setPhase(3);
    setTimeout(() => {
      setPhase(4);
    }, 4000);
  };

  return (
    <>
      {/* Shared Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/60 backdrop-blur-xl border-b border-cyan-400/10 shadow-[0_1px_0_0_rgba(161,250,255,0.1)]">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPhase(1)}>
            <img src={logo} alt="S-KILLING IT Logo" className="h-10 w-auto drop-shadow-lg" />
            <div className="group relative text-2xl md:text-3xl font-black uppercase flex items-center text-transparent" style={{ fontFamily: 'consolas, monospace' }}>
              S-KILLING it
              <span className="absolute top-0 left-0 w-full h-full text-white transition-transform duration-500 [clip-path:polygon(0_0,100%_0,100%_50%,0_50%)] group-hover:-translate-y-[8px]">
                S-KILLING it
              </span>
              <span className="absolute top-0 left-0 w-full h-full text-white transition-transform duration-500 [clip-path:polygon(0_50%,100%_50%,100%_100%,0_100%)] group-hover:translate-y-[8px]">
                S-KILLING it
              </span>
              <span className="absolute top-1/2 left-0 w-[91%] -translate-y-1/2 scale-y-0 group-hover:scale-y-100 transition-transform duration-500 text-slate-950 bg-cyan-400 text-[0.25em] font-bold tracking-[0.5em] md:tracking-[0.7em] text-center ml-1 py-0.5 rounded-[1px] z-10">
                DO EXTRA
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 font-label text-sm uppercase tracking-widest">
            <a className="text-cyan-400 border-b-2 border-cyan-400 pb-1 cursor-pointer" onClick={() => setPhase(phase >= 4 ? 4 : 1)}>Progress</a>
            <a className="text-slate-400 font-medium hover:text-cyan-300 transition-colors cursor-pointer" onClick={() => { setPhase(4); setTimeout(() => document.getElementById('tech-relevant')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Be Relevant</a>
            <a className="text-slate-400 font-medium hover:text-cyan-300 transition-colors cursor-pointer" onClick={() => setPhase(7)}>About Us</a>
          </nav>
          {phase < 4 ? (
            <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dim text-on-primary font-bold px-6 py-2 rounded-full scale-95 active:scale-90 transition-transform font-label text-xs tracking-widest shadow-[0_0_15px_rgba(161,250,255,0.4)]">
              LET'S START
            </button>
          ) : (
            <div className="flex items-center gap-4">
              {streakData.current_streak > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full">
                  <span className="material-symbols-outlined text-orange-400 text-lg">local_fire_department</span>
                  <span className="text-orange-400 font-bold font-mono text-sm">{streakData.current_streak}🔥</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full shadow-[0_0_15px_rgba(161,250,255,0.2)]">
                <span className="material-symbols-outlined text-primary text-lg" data-icon="token">token</span>
                <span className="text-primary font-bold font-mono tracking-widest">{balance} S-Coin</span>
              </div>
              <button className="bg-surface-container-highest hover:bg-surface-bright text-white border border-outline-variant font-bold px-4 py-2 rounded-full scale-95 active:scale-90 transition-transform font-label text-xs tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" data-icon="storefront">storefront</span>
                REWARDS
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Phase 2: Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity">
          <div className="bg-surface-container-high p-10 rounded-[2rem] border border-primary/20 w-full max-w-md shadow-[0_0_50px_rgba(161,250,255,0.15)] relative transform transition-all animate-[bounce_0.3s_ease-out]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-on-surface-variant hover:text-white material-symbols-outlined transition-colors">close</button>
            <div className="mb-8">
              <h3 className="text-3xl font-headline font-bold text-white tracking-tighter">Join the Orbit</h3>
              <p className="text-on-surface-variant text-sm mt-2 font-body">Ready to do extra?</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleRegister(fd.get('email'), fd.get('name')); }} className="space-y-4 mb-8">
              <input name="email" type="email" placeholder="Enter Gmail" required className="w-full bg-surface border border-outline-variant/30 rounded-xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-body text-sm" />
              <input name="name" type="text" placeholder="Enter First Name" required className="w-full bg-surface border border-outline-variant/30 rounded-xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-body text-sm" />
              <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-dim text-on-primary font-black tracking-widest uppercase hover:shadow-[0_0_30px_rgba(161,250,255,0.4)] transition-all">
                Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Phase 3: Transition & Buy-In */}
      {phase === 3 && (
        <div className="fixed inset-0 z-[110] bg-background flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10 opacity-60 animate-pulse"></div>
          <div className="z-10 text-center space-y-10 px-6">
            <h2 className="text-5xl md:text-8xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_0_40px_rgba(161,250,255,0.4)] animate-[pulse_2s_ease-in-out_infinite]">
              Let's start learning.
            </h2>
            <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-primary/20 inline-block shadow-2xl transition-all duration-1000 translate-y-0 opacity-100">
              <p className="text-xl md:text-2xl text-white font-label tracking-widest uppercase mb-8">Your 1 Hour Beyond Academics</p>
              <div className="flex flex-wrap gap-8 justify-center items-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                    <span className="material-symbols-outlined text-3xl text-primary" data-icon="lightbulb">lightbulb</span>
                  </div>
                  <span className="text-xs font-black text-primary tracking-[0.2em]">15M THEORY</span>
                </div>
                <div className="hidden sm:block w-16 h-[2px] bg-gradient-to-r from-primary/30 to-secondary/30"></div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/30">
                    <span className="material-symbols-outlined text-3xl text-secondary" data-icon="construction">construction</span>
                  </div>
                  <span className="text-xs font-black text-secondary tracking-[0.2em]">30M BUILD</span>
                </div>
                <div className="hidden sm:block w-16 h-[2px] bg-gradient-to-r from-secondary/30 to-tertiary/30"></div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-tertiary/10 flex items-center justify-center border border-tertiary/30">
                    <span className="material-symbols-outlined text-3xl text-tertiary" data-icon="verified">verified</span>
                  </div>
                  <span className="text-xs font-black text-tertiary tracking-[0.2em]">15M REVIEW</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 4.5: Reveal Animation */}
      {phase === 4.5 && (
        <div className="fixed inset-0 z-[120] bg-background flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-secondary/5 opacity-50"></div>
          <div className="text-center z-10 scale-110 transition-transform duration-[3000ms] ease-out">
            <span className="text-primary font-label text-xl tracking-[0.5em] uppercase mb-6 block drop-shadow-[0_0_10px_rgba(161,250,255,0.8)]">Today you'll learn:</span>
            <h2 className="text-6xl md:text-9xl font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary drop-shadow-[0_0_50px_rgba(223,183,255,0.6)]">
              AI Vision
            </h2>
          </div>
        </div>
      )}

      {/* Main App Content */}
      <main>
        {phase < 4 && (
          <>
            {/* Phase 1: Landing Page Hook */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
              {/* Background Neural Image & Spline */}
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10 pointer-events-none"></div>
                <spline-viewer style={{ width: '100%', height: 'calc(100% + 60px)', position: 'absolute', top: 0, left: 0 }} className="opacity-80" url="https://prod.spline.design/Cvmz3ejpXJdAHV7N/scene.splinecode"></spline-viewer>
              </div>
              <div className="absolute inset-0 nebula-glow -z-10"></div>
              <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]"></div>

              <div className="max-w-screen-xl px-6 text-center z-10">
                <div className="bg-background/20 backdrop-blur-[2px] rounded-3xl p-4 md:p-8 inline-block relative mt-16">
                  <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-headline font-black tracking-tighter text-on-background mb-10 leading-none relative z-20">
                    Skilling It... <br /> <span className="text-gradient-primary">Let's Do Extra.</span>
                  </h1>

                  <div className="flex justify-center items-center mt-12">
                    <button onClick={() => setIsModalOpen(true)} className="px-12 py-5 rounded-full bg-primary text-on-primary font-black font-label tracking-widest text-lg uppercase hover:shadow-[0_0_50px_rgba(161,250,255,0.6)] hover:scale-105 transition-all flex items-center gap-4 group">
                      Let's Start
                      <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform text-2xl" data-icon="arrow_forward">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Problem Section: The Academic Lag */}
            <section className="py-24 px-6 relative">
              <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter text-on-background">
                    The Academic Lag
                  </h2>
                  <p className="text-on-surface-variant text-lg leading-relaxed">
                    Traditional institutions are optimized for static knowledge. The industry moves at lightspeed. We measured the disconnect across 500+ global tech hubs.
                  </p>

                  <div className="p-8 rounded-2xl glass-panel relative overflow-hidden group">
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-7xl font-headline font-black text-primary">86.5</span>
                      <span className="text-xl font-label text-secondary uppercase tracking-widest">Itch Score</span>
                    </div>
                    <p className="text-sm font-label text-on-surface-variant tracking-wider leading-relaxed">
                      A high-intensity measurement of the <span className="text-primary font-bold">Theory vs. Practical</span> friction experienced by graduates in the first 6 months of employment.
                    </p>
                    <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="material-symbols-outlined text-[150px]" data-icon="error_meditate">error_med</span>
                    </div>
                  </div>
                </div>

                <div className="relative h-[400px] rounded-3xl overflow-hidden glass-panel flex items-center justify-center">
                  <div className="absolute inset-0 bg-surface-container-low/40"></div>
                  <div className="relative z-10 w-full px-8 space-y-8">
                    <div className="flex justify-between items-center text-xs font-label text-on-surface-variant uppercase tracking-[0.2em]">
                      <span>Theory Focus</span>
                      <span>Industry Need</span>
                    </div>
                    <div className="relative h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className="absolute left-0 top-0 h-full w-[90%] bg-secondary shadow-[0_0_15px_rgba(223,183,255,0.6)]"></div>
                      <div className="absolute left-0 top-0 h-full w-[15%] bg-primary shadow-[0_0_15px_rgba(161,250,255,0.6)]"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-surface-container-highest/50 border border-primary/10 text-center">
                        <div className="text-primary font-headline text-2xl font-bold">24%</div>
                        <div className="text-[10px] text-on-surface-variant uppercase mt-1">Application</div>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-container-highest/50 border border-secondary/10 text-center">
                        <div className="text-secondary font-headline text-2xl font-bold">76%</div>
                        <div className="text-[10px] text-on-surface-variant uppercase mt-1">Abstraction</div>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-container-highest/50 border border-tertiary/10 text-center">
                        <div className="text-tertiary font-headline text-2xl font-bold">∞</div>
                        <div className="text-[10px] text-on-surface-variant uppercase mt-1">Potential</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* LOGGED IN DASHBOARD (Phases 4, 5, 6) */}
        {phase >= 4 && phase < 7 && (
          <>
            {/* Phase 4/5: Daily Dashboard */}
            <section className="relative min-h-[80vh] flex items-center justify-center pt-24 pb-12 overflow-hidden border-b border-primary/10">
              <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none"></div>
                <spline-viewer style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} className="opacity-20" url="https://prod.spline.design/Cvmz3ejpXJdAHV7N/scene.splinecode"></spline-viewer>
              </div>

              <div className="max-w-screen-2xl w-full px-6 z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-md">
                    <span className="material-symbols-outlined text-primary text-sm" data-icon="schedule">schedule</span>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Your 1-Hour Focus</span>
                  </div>

                  <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tighter text-on-background leading-tight">
                    Today's Sprint: <br /> <span className="text-gradient-primary drop-shadow-[0_0_20px_rgba(161,250,255,0.3)]">AI Vision Module</span>
                  </h1>

                  <p className="text-lg text-on-surface-variant font-body max-w-lg leading-relaxed">
                    Dive into the architecture of Convolutional Neural Networks. Your goal today is to deploy a real-time object detection model.
                  </p>

                  {phase === 4 ? (
                    <button onClick={handleStartSprint} className="px-10 py-5 rounded-2xl bg-primary text-on-primary font-black font-label tracking-widest uppercase hover:shadow-[0_0_40px_rgba(161,250,255,0.4)] transition-all flex items-center gap-4 group text-sm md:text-base">
                      Start Today's Sprint
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-2xl" data-icon="play_arrow">play_arrow</span>
                    </button>
                  ) : (
                    <div className="glass-panel p-6 rounded-3xl border border-primary/30 inline-block bg-primary/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                          <span className="material-symbols-outlined text-primary" data-icon="timer">timer</span>
                        </div>
                        <div>
                          <span className="text-xs font-black text-primary uppercase tracking-[0.2em] block mb-1">Time to Completion</span>
                          <div className="text-4xl font-headline font-black text-white tracking-widest font-mono drop-shadow-[0_0_10px_rgba(161,250,255,0.6)]">
                            {formatTime(countdown)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-panel rounded-[2.5rem] p-8 relative overflow-hidden h-[450px] border border-outline-variant/30 flex items-center justify-center group shadow-2xl">
                  <div className="absolute inset-0 bg-surface-container-low/50"></div>

                  {phase === 4 ? (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
                      <div className="w-20 h-20 rounded-full border-2 border-outline-variant flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant" data-icon="lock">lock</span>
                      </div>
                      <p className="text-on-surface-variant font-black tracking-[0.2em] uppercase text-sm">Start Sprint to Unlock</p>
                    </div>
                  ) : null}

                  <div className={`w-full h-full relative z-10 transition-all duration-1000 ${phase === 4 ? 'opacity-20 blur-md scale-95' : 'opacity-100 blur-0 scale-100'}`}>
                    <CurriculumEngineWidget 
                      studentId={studentId} 
                      analyticsData={analyticsData} 
                      refreshData={fetchData} 
                      setPhase={setPhase}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Phase 6: Let's Be Tech Relevant */}
            <section id="tech-relevant" className="py-24 bg-surface-container-lowest overflow-hidden">
              <div className="max-w-screen-2xl mx-auto px-6">
                <div className="mb-16">
                  <span className="text-secondary font-label text-xs font-bold tracking-[0.3em] uppercase">Industry Deep Dive</span>
                  <h2 className="text-5xl md:text-6xl font-headline font-bold tracking-tighter mt-2 text-white">Let's Be Tech Relevant</h2>
                  <p className="text-on-surface-variant text-lg mt-4 max-w-2xl font-body">Not just news. Real engineering breakdowns of what's happening right now.</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Tech Dive Item 1 */}
                  <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-outline-variant/20 relative group hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[2.5rem] pointer-events-none group-hover:from-primary/10 transition-colors duration-500"></div>

                    <div className="relative z-10 space-y-8">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="material-symbols-outlined text-primary" data-icon="new_releases">new_releases</span>
                          <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">1. The Update</h3>
                        </div>
                        <h4 className="text-2xl font-headline font-bold text-white mb-3">SpaceX Catches Super Heavy Booster</h4>
                        <p className="text-on-surface-variant leading-relaxed text-sm font-body">SpaceX successfully caught their returning Starship booster using the Mechazilla catch tower arms on their first attempt.</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="material-symbols-outlined text-secondary" data-icon="science">science</span>
                          <h3 className="text-[10px] font-black tracking-widest text-secondary uppercase">2. The Science</h3>
                        </div>
                        <p className="text-on-surface-variant leading-relaxed text-sm font-body">Instead of landing legs, the booster hovers with millimeter precision using vector thrust and cold gas thrusters while the tower's "chopsticks" close exactly under the load points.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/20">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-emerald-400 text-sm" data-icon="task_alt">task_alt</span>
                            <h3 className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">3. The Verdict</h3>
                          </div>
                          <p className="text-on-surface-variant text-xs leading-relaxed font-body">Massive Success. By eliminating landing leg weight, they increased payload capacity by ~10%.</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-tertiary text-sm" data-icon="update">update</span>
                            <h3 className="text-[10px] font-black tracking-widest text-tertiary uppercase">4. Future Impact</h3>
                          </div>
                          <p className="text-on-surface-variant text-xs leading-relaxed font-body">Rapid reusability. A rocket could potentially launch, land, and launch again within hours.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tech Dive Item 2 */}
                  <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border border-outline-variant/20 relative group hover:-translate-y-2 transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent rounded-[2.5rem] pointer-events-none group-hover:from-secondary/10 transition-colors duration-500"></div>

                    <div className="relative z-10 space-y-8">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="material-symbols-outlined text-secondary" data-icon="terminal">terminal</span>
                          <h3 className="text-[10px] font-black tracking-widest text-secondary uppercase">1. The Update</h3>
                        </div>
                        <h4 className="text-2xl font-headline font-bold text-white mb-3">Anthropic releases Computer Use API</h4>
                        <p className="text-on-surface-variant leading-relaxed text-sm font-body">Claude 3.5 Sonnet can now directly interact with a computer interface, clicking, typing, and moving the cursor.</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="material-symbols-outlined text-tertiary" data-icon="memory">memory</span>
                          <h3 className="text-[10px] font-black tracking-widest text-tertiary uppercase">2. The Science</h3>
                        </div>
                        <p className="text-on-surface-variant leading-relaxed text-sm font-body">The model is trained to output screen coordinates and tool-use JSON payloads. A background agent executes OS-level PyAutoGUI commands based on Claude's predictions.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/20">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary text-sm" data-icon="balance">balance</span>
                            <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">3. The Verdict</h3>
                          </div>
                          <p className="text-on-surface-variant text-xs leading-relaxed font-body">Mixed. Highly capable for basic tasks but struggles with infinite scrolling and dynamic UI elements.</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-tertiary text-sm" data-icon="trending_up">trending_up</span>
                            <h3 className="text-[10px] font-black tracking-widest text-tertiary uppercase">4. Future Impact</h3>
                          </div>
                          <p className="text-on-surface-variant text-xs leading-relaxed font-body">QA Testing, automated data entry, and basic IT helpdesk jobs will see major disruption.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pillar II: Learn & Build */}
            <section className="py-24 px-6 relative">
              <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                  <span className="text-secondary font-label text-xs font-bold tracking-[0.3em] uppercase">Pillar II</span>
                  <h2 className="text-4xl md:text-5xl font-headline font-bold tracking-tighter mt-2">Learn &amp; Build</h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <h3 className="text-xl font-label uppercase tracking-widest text-on-surface">Active Sprints</h3>
                    <div className="p-8 rounded-2xl glass-panel group hover:bg-surface-container-high transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined" data-icon="model_training">model_training</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-headline font-bold">Machine Learning Fundamentals</h4>
                            <p className="text-xs text-on-surface-variant">Module 04: Linear Regression Optimization</p>
                          </div>
                        </div>
                        <span className="text-primary font-headline font-bold">65%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full w-[65%] bg-primary shadow-[0_0_15px_rgba(161,250,255,0.6)]"></div>
                      </div>
                    </div>

                    <div className="p-8 rounded-2xl glass-panel group hover:bg-surface-container-high transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined" data-icon="hub">hub</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-headline font-bold">Neural Networks &amp; Deep Learning</h4>
                            <p className="text-xs text-on-surface-variant">Module 12: Backpropagation Mechanics</p>
                          </div>
                        </div>
                        <span className="text-secondary font-headline font-bold">32%</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full w-[32%] bg-secondary shadow-[0_0_15px_rgba(223,183,255,0.6)]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-1 glass-panel rounded-3xl p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="material-symbols-outlined text-tertiary" data-icon="architecture">architecture</span>
                      <h3 className="text-xl font-label uppercase tracking-widest">Micro-Projects</h3>
                    </div>
                    <div className="flex-grow space-y-6">
                      <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20">
                        <h4 className="font-bold text-sm mb-1">D-Build: Object Detection</h4>
                        <p className="text-xs text-on-surface-variant">Integrate YOLOv8 with a Raspberry Pi camera module.</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-tertiary/10 text-tertiary">MEDIUM</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">150 XP</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 opacity-60">
                        <h4 className="font-bold text-sm mb-1">S-Build: Sentiment Mesh</h4>
                        <p className="text-xs text-on-surface-variant">Deploy a distributed sentiment analysis worker cluster.</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-secondary/10 text-secondary">HARD</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary">400 XP</span>
                        </div>
                      </div>
                    </div>
                    <button className="mt-8 w-full py-4 rounded-xl border border-primary/40 text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary/5 transition-all">
                      Submit Build
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Peer Review Section */}
            <section className="py-16 px-6 relative z-10">
              <div className="max-w-5xl mx-auto">
                <PeerReviewWidget studentId={studentId} balance={balance} setBalance={setBalance} />
              </div>
            </section>

            {/* Rewards & Certification */}
            <section className="py-32 px-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-secondary/5 to-tertiary/5 mix-blend-screen pointer-events-none"></div>
              <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
                <div className="inline-block p-1 rounded-full bg-gradient-to-r from-tertiary to-primary animate-[pulse_2s_ease-in-out_infinite]">
                  <div className="px-6 py-2 rounded-full bg-background font-black text-[10px] tracking-[0.4em] uppercase">Industry-Ready Certification</div>
                </div>

                <h2 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter text-on-background">
                  Your <span className="text-tertiary">End-of-Year</span> Credential
                </h2>

                <div className="relative group">
                  <div className="absolute inset-0 blur-3xl bg-tertiary/10 scale-90 group-hover:scale-100 transition-transform duration-700"></div>
                  <div className="glass-panel rounded-3xl p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-shrink-0 w-48 h-64 border-2 border-dashed border-tertiary/30 rounded-lg flex items-center justify-center bg-tertiary/5 relative">
                      <span className="material-symbols-outlined text-tertiary text-6xl" data-icon="workspace_premium" data-weight="fill">workspace_premium</span>
                      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary shadow-[0_0_20px_rgba(251,219,94,0.5)]">
                        <span className="material-symbols-outlined" data-icon="verified">verified</span>
                      </div>
                    </div>

                    <div className="text-left space-y-6">
                      <h3 className="text-3xl font-headline font-bold">The S-KILL Orbital Certificate</h3>
                      <p className="text-on-surface-variant leading-relaxed">
                        Not just a piece of paper. A living, dynamic NFT credential that showcases your real-time skill growth, project contributions, and peer-validated technical dexterity.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm" data-icon="check_circle">check_circle</span>
                          <span className="text-xs font-label">Validated by Microsoft Architects</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm" data-icon="check_circle">check_circle</span>
                          <span className="text-xs font-label">Ethereum Chain Authenticated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-12">
                  <h4 className="text-xs font-black tracking-[0.5em] text-on-surface-variant uppercase mb-8">Daily Momentum Rewards</h4>
                  <div className="flex justify-center gap-6 overflow-x-auto no-scrollbar py-4">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full border-2 border-primary flex items-center justify-center bg-primary/10 shadow-[0_0_15px_rgba(161,250,255,0.3)]">
                        <span className="material-symbols-outlined text-primary" data-icon="local_fire_department">local_fire_department</span>
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase">3 Day Streak</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <div className="w-14 h-14 rounded-full border-2 border-outline-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline-variant" data-icon="rocket">rocket</span>
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase">7 Day Boost</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <div className="w-14 h-14 rounded-full border-2 border-outline-variant flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline-variant" data-icon="token">token</span>
                      </div>
                      <span className="text-[10px] font-bold tracking-widest uppercase">S-Tokens</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Weekly Analytics Section */}
            <section className="py-16 px-6 border-b border-primary/10">
              <div className="max-w-screen-2xl mx-auto">
                <WeeklyAnalytics analytics={analyticsData} />
              </div>
            </section>

            {/* Streak & Badges Section */}
            <section className="py-16 px-6 bg-surface-container-lowest border-b border-primary/10">
              <div className="max-w-screen-2xl mx-auto grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <StreakTracker
                    currentStreak={streakData.current_streak}
                    longestStreak={streakData.longest_streak}
                    milestones={streakData.milestones || [
                      { target_days: 3, reward_xp: 50, badge: 'on_fire', achieved: false, progress_percent: 0 },
                      { target_days: 7, reward_xp: 100, badge: 'unstoppable', achieved: false, progress_percent: 0 },
                      { target_days: 30, reward_xp: 500, badge: 'month_master', achieved: false, progress_percent: 0 },
                      { target_days: 76, reward_xp: 1000, badge: 'industry_ready_builder', achieved: false, progress_percent: 0 },
                    ]}
                  />
                </div>
                <div className="lg:col-span-2">
                  <BadgeShowcase badges={badgesData} />
                </div>
              </div>
            </section>

            {/* Leaderboard Section */}
            <section className="py-16 px-6">
              <div className="max-w-screen-2xl mx-auto">
                <LeaderboardWidget leaderboard={leaderboard} currentStudentId={studentId} />
              </div>
            </section>
          </>
        )}

        {/* Phase 7: About Us (Vision) */}
        {phase === 7 && (
          <section className="relative min-h-[80vh] flex items-center justify-center pt-24 pb-12 overflow-hidden px-6">
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none"></div>
              <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px]"></div>
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 animate-[pulse_1s_ease-out]">
              <span className="text-secondary font-label text-xs font-bold tracking-[0.4em] uppercase block">Our Vision</span>
              <h2 className="text-5xl md:text-7xl font-headline font-black text-white tracking-tighter">
                Bridging the <span className="text-gradient-primary">Relevance Gap</span>
              </h2>
              
              <div className="glass-panel p-10 md:p-16 rounded-[3rem] border border-outline-variant/30 text-left space-y-8 relative overflow-hidden mt-12 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <span className="material-symbols-outlined text-[120px]" data-icon="visibility">visibility</span>
                </div>
                <p className="text-xl md:text-2xl text-on-surface-variant font-body leading-relaxed">
                  College students attend classes all day, yet many remain entirely disconnected from industry needs, lacking fundamental practical skills.
                </p>
                <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                <p className="text-xl md:text-2xl text-white font-body leading-relaxed font-bold">
                  We are here with a vision to make students <span className="text-primary">relevant</span> to what is actively happening in the Techverse. We teach real-world engineering skills that make you stand out from the crowd.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Phase 8: Quiz Mode */}
        {phase === 8 && (
          <section className="relative min-h-screen flex items-center justify-center p-6 bg-background overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0"></div>
            
            <div className="relative z-10 w-full max-w-3xl glass-panel p-8 md:p-12 rounded-[2.5rem] border border-primary/30 shadow-[0_0_50px_rgba(161,250,255,0.1)] flex justify-center">
              <QuizWidget 
                studentId={studentId} 
                weekNumber={Math.max(1, Math.floor((analyticsData.total_lessons_completed || 0) / 7))} 
                setPhase={setPhase}
                refreshData={fetchData}
              />
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-cyan-900/20 bg-slate-950/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row justify-between items-center px-10 gap-6 max-w-screen-2xl mx-auto">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <img src={logo} alt="S-KILLING IT Logo" className="h-6 w-auto grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
              <span className="text-cyan-400 font-bold text-lg font-headline tracking-tighter">S-KILLING IT</span>
            </div>
            <span className="text-slate-500 font-manrope text-[10px] tracking-widest uppercase">© 2024 S-KILLING IT. THE ORBITING INTELLIGENCE.</span>
          </div>
          <div className="flex gap-8 font-manrope text-sm tracking-widest uppercase">
            <a className="text-slate-500 hover:text-purple-400 transition-colors duration-500 cursor-pointer" onClick={() => setPhase(phase >= 4 ? 4 : 1)}>Progress</a>
            <a className="text-slate-500 hover:text-purple-400 transition-colors duration-500 cursor-pointer" onClick={() => { setPhase(4); setTimeout(() => document.getElementById('tech-relevant')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>Be Relevant</a>
            <a className="text-slate-500 hover:text-purple-400 transition-colors duration-500 cursor-pointer" onClick={() => setPhase(7)}>About Us</a>
            <a className="text-slate-500 hover:text-purple-400 transition-colors duration-500 cursor-pointer">Support</a>
          </div>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-slate-500 hover:text-cyan-400 cursor-pointer" data-icon="language">language</span>
            <span className="material-symbols-outlined text-slate-500 hover:text-cyan-400 cursor-pointer" data-icon="share">share</span>
          </div>
        </div>
      </footer>
    </>
  );
}
