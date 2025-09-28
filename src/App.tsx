import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Map, List, ItemDetail, Donate } from './pages';
import { Navigation } from './components';
import './App.css';

function App() {
  return (
    <Router basename="/wingman">
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <main className="flex-1 min-h-0">
            <Routes>
              <Route path="/" element={<Map />} />
              <Route path="/list" element={<List />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/donate" element={<Donate />} />
              {/* Catch-all route for unknown paths */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
  );
}

export default App;
