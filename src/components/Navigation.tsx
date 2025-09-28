import { Link, useLocation } from 'react-router-dom';
import { Heart, List, Map, DollarSign, User, LogOut } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();


  const isActive = (path: string) => {
    // Handle root path redirect to map
    if (path === '/' && (location.pathname === '/' || location.pathname === '/wingman' || location.pathname === '/wingman/')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="./wingman-icon.png" 
              alt="Wingman" 
              className="h-10 w-auto"
            />
            <span className="brand-font font-bold ml-2 text-3xl text-wingman-purple">WINGMAN</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') 
                  ? 'bg-wingman-purple text-white' 
                  : 'text-gray-600 hover:text-wingman-purple hover:bg-wingman-purple hover:bg-opacity-10'
              }`}
            >
              <Map className="w-4 h-4 mr-2" />
              Map
            </Link>
            
            <Link
              to="/list"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/list') 
                  ? 'bg-wingman-purple text-white' 
                  : 'text-gray-600 hover:text-wingman-purple hover:bg-wingman-purple hover:bg-opacity-10'
              }`}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Link>

            <Link
              to="/donate"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/donate') 
                  ? 'bg-wingman-pink text-white' 
                  : 'text-gray-600 hover:text-wingman-pink hover:bg-wingman-pink hover:bg-opacity-10'
              }`}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Donate
            </Link>

            <Link
              to="/sign-in"
              className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-wingman-orange hover:bg-wingman-orange-light transition-colors"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link
              to="/sign-in"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-wingman-orange hover:text-wingman-orange-light"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}