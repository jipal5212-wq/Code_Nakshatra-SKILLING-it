import { Clock, CheckCircle, ArrowRight, Play, BookOpen, PenTool } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="welcome-text">Welcome back, Arjun 👋</h1>
          <p className="subtitle">Ready for your daily 1-hour professional incubator?</p>
        </div>
        <div className="domain-badge">
          Domain: Web Development
        </div>
      </header>

      <section className="daily-block">
        <div className="block-header">
          <h2>Today's 1-Hour Block</h2>
          <span className="time-remaining"><Clock size={16}/> 60 mins remaining</span>
        </div>

        <div className="block-segments">
          {/* Techverse Segment */}
          <div className="segment-card">
            <div className="segment-icon techverse">
              <BookOpen size={24} />
            </div>
            <div className="segment-content">
              <h3>Techverse Feed</h3>
              <p>15 mins • 3 new industry insights</p>
            </div>
            <button className="btn-start"><Play size={16} /> Start</button>
          </div>

          {/* Learn Segment */}
          <div className="segment-card locked">
            <div className="segment-icon learn">
              <CheckCircle size={24} />
            </div>
            <div className="segment-content">
              <h3>Learn: React Hooks Deep Dive</h3>
              <p>20 mins • Video + Docs</p>
            </div>
            <button className="btn-locked" disabled>Locked</button>
          </div>

          {/* Build Segment */}
          <div className="segment-card locked">
            <div className="segment-icon build">
              <PenTool size={24} />
            </div>
            <div className="segment-content">
              <h3>Build: Context API Cart</h3>
              <p>25 mins • Hands-on Micro-Project</p>
            </div>
            <button className="btn-locked" disabled>Locked</button>
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-header">
            <h3>Skill Radar</h3>
            <button className="btn-link">View Full <ArrowRight size={16}/></button>
          </div>
          <div className="radar-content">
            <div className="radar-item rising">
              <span className="radar-skill">Next.js App Router</span>
              <span className="radar-trend">↗ Rising</span>
            </div>
            <div className="radar-item stable">
              <span className="radar-skill">React Context</span>
              <span className="radar-trend">→ Stable</span>
            </div>
            <div className="radar-item declining">
              <span className="radar-skill">Redux (Boilerplate)</span>
              <span className="radar-trend">↘ Declining</span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h3>Recommended For You</h3>
          </div>
          <div className="recommendation">
            <h4>Docker for Web Devs</h4>
            <p className="demand-score">Demand Score: 85/100</p>
            <p className="context">68% of backend job postings now require container knowledge.</p>
            <button className="btn-secondary">Add to Roadmap</button>
          </div>
        </section>
      </div>
    </div>
  );
}
