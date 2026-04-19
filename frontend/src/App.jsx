import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [backendMessage, setBackendMessage] = useState('Connecting to backend...');
  const [isConnected, setIsConnected] = useState(false);

  const fetchBackendData = async () => {
    try {
      setBackendMessage('Connecting to backend...');
      setIsConnected(false);
      // Ensure backend is running on 5000
      const response = await fetch('http://localhost:5000/api/hello');
      const data = await response.json();
      setBackendMessage(data.message);
      setIsConnected(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      setBackendMessage('Failed to connect to backend. Is it running on port 5000?');
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  return (
    <>
      <div className="bg-glow"></div>
      <div className="app-container">
        <header>
          <div className="logo">AntiGravity App</div>
        </header>
        
        <main className="main-content">
          <div>
            <h1>Build <span className="gradient-text">Awesome</span> Skills</h1>
            <p className="subtitle">
              Your new fullstack Vite + Express application is ready to go. Start building amazing features with a beautiful aesthetic right out of the box.
            </p>
          </div>

          <div className="card">
            <div className="status-indicator">
              <div className={`status-dot ${!isConnected ? 'offline' : ''}`} style={!isConnected ? { backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444', animation: 'none' } : {}}></div>
              {isConnected ? 'System Online' : 'System Offline'}
            </div>
            
            <div className="message-box">
              {backendMessage}
            </div>

            <button className="button" onClick={fetchBackendData}>
              Ping Backend Again
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

export default App;
