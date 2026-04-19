import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, BookOpen, User, Settings, Award } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { name: 'Techverse Feed', path: '/feed', icon: <Compass size={20} /> },
    { name: 'Learn & Build', path: '/build', icon: <BookOpen size={20} /> },
    { name: 'Portfolio', path: '/portfolio', icon: <User size={20} /> },
    { name: 'Certifications', path: '/certs', icon: <Award size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">S-KILLING IT</span>
      </div>
      
      <div className="streak-widget">
        <div className="streak-icon">🔥</div>
        <div className="streak-info">
          <span className="streak-count">12 Days</span>
          <span className="streak-label">Current Streak</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
