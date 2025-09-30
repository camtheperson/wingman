import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Map, List, ItemDetail, Donate } from './pages';
import { Navigation, WelcomeModal } from './components';

function App() {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome modal in the last 24 hours
    const lastSeenTimestamp = localStorage.getItem('wingman-welcome-last-seen');
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    if (!lastSeenTimestamp || (now - parseInt(lastSeenTimestamp)) >= oneDayInMs) {
      setShowWelcomeModal(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem('wingman-welcome-last-seen', Date.now().toString());
  };
  return (
    <Router basename="/wingman">
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <main className="flex-1 min-h-0 relative">
            <Routes>
              <Route path="/" element={<Map />} />
              <Route path="/list" element={<List />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/donate" element={<Donate />} />
              {/* Catch-all route for unknown paths */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <WelcomeModal 
            isOpen={showWelcomeModal} 
            onClose={handleCloseWelcome}
          />
        </div>
      </Router>
  );
}

export default App;
