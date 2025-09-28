import { Link, useLocation } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Heart, List, Map, DollarSign, User, LogOut } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getCurrentUser);
  const isLoadingUser = user === undefined;

  const isActive = (path: string) => {
    // Handle root path redirect to map
    if (path === '/' && (location.pathname === '/' || location.pathname === '/wingman' || location.pathname === '/wingman/')) {
      return true;
    }
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    await signOut();
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

            {isLoadingUser ? (
              <div className="flex items-center px-4 py-2">
                <div className="animate-pulse bg-gray-200 rounded h-8 w-20"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/favorites"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-wingman-pink hover:bg-wingman-pink hover:bg-opacity-10"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Favorites
                </Link>
                
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{user.name || user.email || 'User'}</span>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-wingman-purple hover:bg-wingman-purple hover:bg-opacity-10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-wingman-orange hover:bg-wingman-orange-light transition-colors"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            {isLoadingUser ? (
              <div className="flex items-center px-3 py-2">
                <div className="animate-pulse bg-gray-200 rounded h-6 w-6"></div>
              </div>
            ) : user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-wingman-purple"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                to="/sign-in"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-wingman-orange hover:text-wingman-orange-light"
              >
                <User className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}