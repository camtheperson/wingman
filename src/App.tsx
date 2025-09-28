import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { useConvex } from 'convex/react';
import { Map, List, ItemDetail, Donate, SignIn, SignUp } from './pages';
import { Navigation } from './components';
import './App.css';

function App() {
  const convex = useConvex();
  
  return (
    <ConvexAuthProvider client={convex}>
      <Router basename="/wingman/">
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <main className="flex-1 min-h-0">
            <Routes>
              <Route path="/" element={<Map />} />
              <Route path="/list" element={<List />} />
              <Route path="/item/:id" element={<ItemDetail />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ConvexAuthProvider>
  );
}

export default App;
