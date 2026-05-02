import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const INTERESTS = ['AI & ML', 'Web Dev', 'Robotics', 'Cybersecurity', 'Blockchain', 'Data Science'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const MOCK_TASKS = [
  {
    id: 1,
    title: 'API Integration Basics',
    objective: 'Understand how to consume third-party REST APIs.',
    videoTitle: 'JavaScript Fetch API Tutorial',
    videoTime: 'Watch first 15-20 mins',
    description: 'Fetch weather data using the OpenWeather API or any free public API.',
    expectedOutput: 'Display the current temperature of a specific city in the browser console or DOM.',
    tags: ['Web Dev', 'Intermediate']
  },
  {
    id: 2,
    title: 'Intro to Linear Regression',
    objective: 'Grasp the foundational math behind machine learning.',
    videoTitle: 'Linear Regression explained visually',
    videoTime: 'Watch first 12 mins',
    description: 'Implement a simple linear regression model using Python and scikit-learn on a dummy dataset.',
    expectedOutput: 'Print the slope and intercept of your trained model.',
    tags: ['AI & ML', 'Beginner']
  },
  {
    id: 3,
    title: 'Smart Contract Basics',
    objective: 'Learn the structure of a Solidity contract.',
    videoTitle: 'Solidity Tutorial - A Full Course',
    videoTime: 'Watch 0:00 to 25:00',
    description: 'Write a simple smart contract that stores and retrieves a string.',
    expectedOutput: 'A successfully compiled contract deployed on Remix IDE.',
    tags: ['Blockchain', 'Beginner']
  },
  {
    id: 4,
    title: 'DOM Manipulation Challenge',
    objective: 'Dynamically update the UI using Vanilla JS.',
    videoTitle: 'DOM Manipulation Crash Course',
    videoTime: 'Watch 5:00 to 18:00',
    description: 'Create a button that toggles the background color of the page between dark and light modes.',
    expectedOutput: 'A working toggle button with smooth CSS transitions.',
    tags: ['Web Dev', 'Beginner']
  },
  {
    id: 5,
    title: 'Data Scraping 101',
    objective: 'Extract data from static HTML pages.',
    videoTitle: 'BeautifulSoup Tutorial',
    videoTime: 'Watch first 20 mins',
    description: 'Write a Python script to scrape the titles of the top 5 articles on Hacker News.',
    expectedOutput: 'A console output listing the 5 article titles.',
    tags: ['Data Science', 'Intermediate']
  },
  {
    id: 6,
    title: 'Basic SQL Queries',
    objective: 'Learn how to retrieve structured data.',
    videoTitle: 'SQL Basics for Beginners',
    videoTime: 'Watch 10:00 to 30:00',
    description: 'Write a query to select all users who signed up in the last 7 days from a mock users table.',
    expectedOutput: 'The correct SQL query syntax.',
    tags: ['Data Science', 'Beginner']
  }
];

export default function Dashboard() {
  const [phase, setPhase] = useState('landing'); // landing, onboarding, pool, execution, submission, review
  
  // User Data
  const [interest, setInterest] = useState('');
  const [level, setLevel] = useState('');
  const [streak, setStreak] = useState(12);
  const [points, setPoints] = useState(350);
  
  // Task Data
  const [selectedTask, setSelectedTask] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(2 * 60 * 60); // 2 hours for selection
  const [executionTime, setExecutionTime] = useState(22 * 60 * 60); // remaining 24h
  
  // Submission
  const [submissionLink, setSubmissionLink] = useState('');

  // Timers
  useEffect(() => {
    let timer;
    if (phase === 'pool' && timeRemaining > 0) {
      timer = setInterval(() => setTimeRemaining(t => t - 1), 1000);
    } else if (phase === 'execution' && executionTime > 0) {
      timer = setInterval(() => setExecutionTime(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [phase, timeRemaining, executionTime]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartOnboarding = () => setPhase('onboarding');
  
  const finishOnboarding = () => {
    if (interest && level) {
      setPhase('pool');
    }
  };

  const selectTask = (task) => {
    setSelectedTask(task);
    setPhase('execution');
  };

  const submitWork = (e) => {
    e.preventDefault();
    setPhase('review');
  };

  const renderHeader = () => (
    <header className="fixed top-0 w-full z-50 bg-[#0c0e12]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="font-bold tracking-widest uppercase text-white cursor-pointer" onClick={() => setPhase('landing')}>
          S-KILLING it
        </div>
        {phase !== 'landing' && phase !== 'onboarding' && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
              <span className="material-symbols-outlined text-[18px] text-orange-500">local_fire_department</span>
              {streak} Days
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
              <span className="material-symbols-outlined text-[18px] text-cyan-400">token</span>
              {points} XP
            </div>
          </div>
        )}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-[#0c0e12] text-gray-200 font-sans selection:bg-cyan-500/30">
      {renderHeader()}
      
      <main className="pt-24 pb-20 px-6 max-w-6xl mx-auto min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* LANDING PAGE */}
          {phase === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-grow flex flex-col justify-center items-center text-center max-w-3xl mx-auto"
            >
              <div className="inline-block px-3 py-1 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-full mb-8">
                Execution > Consumption
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                Don't just watch tutorials. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  Build everyday.
                </span>
              </h1>
              <p className="text-lg text-gray-400 mb-12 max-w-2xl leading-relaxed">
                A daily execution system enforcing consistency. We curate YouTube's best content, assign you a practical micro-task, and verify your submission. Convert learning into real skills.
              </p>
              
              <button 
                onClick={handleStartOnboarding}
                className="bg-white text-black font-bold px-8 py-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                Start Building Now
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>

              <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-white/10 pt-16">
                <div>
                  <h3 className="text-white font-bold mb-2">Free Content</h3>
                  <p className="text-sm text-gray-500">We utilize the best free resources from YouTube instead of locking knowledge behind paywalls.</p>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2">Mandatory Tasks</h3>
                  <p className="text-sm text-gray-500">Learning is passive. Execution is active. You must complete a task within 24 hours.</p>
                </div>
                <div>
                  <h3 className="text-white font-bold mb-2">Verified Streaks</h3>
                  <p className="text-sm text-gray-500">No fake progress. Submissions are reviewed to maintain your streak and earn rewards.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ONBOARDING */}
          {phase === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col justify-center max-w-xl mx-auto w-full"
            >
              <h2 className="text-3xl font-bold text-white mb-2">Customize your path</h2>
              <p className="text-gray-400 mb-8">Tell us what you want to master.</p>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">1. Primary Interest</label>
                  <div className="flex flex-wrap gap-3">
                    {INTERESTS.map(int => (
                      <button 
                        key={int}
                        onClick={() => setInterest(int)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          interest === int 
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        {int}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-4">2. Current Level</label>
                  <div className="flex gap-3">
                    {LEVELS.map(lvl => (
                      <button 
                        key={lvl}
                        onClick={() => setLevel(lvl)}
                        className={`flex-1 px-4 py-3 rounded-lg border text-sm text-center transition-all ${
                          level === lvl 
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-end">
                <button 
                  onClick={finishOnboarding}
                  disabled={!interest || !level}
                  className="bg-white text-black font-bold px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Daily Tasks
                </button>
              </div>
            </motion.div>
          )}

          {/* DAILY TASK POOL */}
          {phase === 'pool' && (
            <motion.div 
              key="pool"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Daily Task Pool</h2>
                  <p className="text-gray-400">Select one task to execute today based on your focus: <span className="text-cyan-400">{interest}</span></p>
                </div>
                <div className="text-right bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Selection Window</div>
                  <div className="text-xl font-mono text-white">{formatTime(timeRemaining)}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_TASKS.map(task => (
                  <div key={task.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-cyan-500/50 transition-colors flex flex-col">
                    <div className="flex gap-2 mb-3">
                      {task.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider bg-white/10 text-gray-300 px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{task.title}</h3>
                    <p className="text-sm text-gray-400 mb-6 flex-grow">{task.objective}</p>
                    
                    <div className="bg-black/30 rounded p-3 mb-6">
                      <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                        <span className="material-symbols-outlined text-[14px]">play_circle</span>
                        {task.videoTitle}
                      </div>
                      <div className="text-xs text-cyan-400">{task.videoTime}</div>
                    </div>

                    <button 
                      onClick={() => selectTask(task)}
                      className="w-full py-2 border border-white/20 rounded text-sm font-bold text-white hover:bg-white hover:text-black transition-colors"
                    >
                      Select Task
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 text-center text-sm text-gray-500 bg-white/5 py-3 rounded-lg border border-white/5">
                If no task is selected within the time window, the system will auto-assign one based on your level.
              </div>
            </motion.div>
          )}

          {/* EXECUTION PHASE */}
          {phase === 'execution' && selectedTask && (
            <motion.div 
              key="execution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto w-full"
            >
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setPhase('pool')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h2 className="text-3xl font-bold text-white">Execution Phase</h2>
                <div className="ml-auto bg-cyan-500/10 border border-cyan-500/30 px-4 py-2 rounded-lg flex items-center gap-3">
                  <span className="text-xs text-cyan-400 uppercase font-bold tracking-widest">Time to build</span>
                  <span className="text-xl font-mono text-white">{formatTime(executionTime)}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">1. The Objective</h3>
                    <p className="text-lg text-white mb-6">{selectedTask.title}</p>
                    
                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">2. Learning Material</h3>
                    <div className="bg-black/40 rounded-lg p-4 border border-white/5 mb-6 flex items-start gap-4">
                      <div className="w-24 h-16 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-gray-500">play_arrow</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{selectedTask.videoTitle}</div>
                        <div className="text-sm text-cyan-400 mt-1">{selectedTask.videoTime}</div>
                      </div>
                    </div>

                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">3. Your Task</h3>
                    <p className="text-gray-300 leading-relaxed mb-6">{selectedTask.description}</p>

                    <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">4. Expected Output</h3>
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 p-4 rounded-lg text-sm">
                      {selectedTask.expectedOutput}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <div className="bg-[#111318] border border-white/10 rounded-xl p-6 sticky top-28">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">upload_file</span>
                      Submit Work
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Provide a link to your code (GitHub, CodeSandbox, Replit) or a hosted demo.
                    </p>
                    <form onSubmit={submitWork}>
                      <input 
                        type="url" 
                        required
                        placeholder="https://github.com/..."
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 mb-4"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                      />
                      <button 
                        type="submit"
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Submit for Review
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* REVIEW PHASE */}
          {phase === 'review' && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-grow flex flex-col justify-center items-center text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-cyan-400">check_circle</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Submission Received</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Your work has been submitted to the admin queue. Once verified, your streak will be extended and you'll earn points. 
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-full text-left mb-8">
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Status</div>
                <div className="text-yellow-500 font-bold mb-4">Pending Review</div>
                
                <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Next Cycle</div>
                <div className="text-white">New tasks open in 12h 45m</div>
              </div>

              <button 
                onClick={() => {
                  setPhase('pool');
                  setSubmissionLink('');
                  setSelectedTask(null);
                }}
                className="text-gray-400 hover:text-white transition-colors text-sm font-bold"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
