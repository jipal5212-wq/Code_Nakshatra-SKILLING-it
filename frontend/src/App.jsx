import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Add other routes here as they are built */}
            <Route path="*" element={<div className="placeholder"><h2>Coming Soon</h2><p>This module is under construction.</p></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
