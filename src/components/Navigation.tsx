import { Link, useLocation } from 'react-router-dom';
import { List, Map, DollarSign, Filter, User } from 'lucide-react';
import { SignInButton, UserButton } from '@clerk/clerk-react';
import { Authenticated, Unauthenticated } from 'convex/react';

export default function Navigation() {
  const location = useLocation();
  
  const handleMobileFilterClick = () => {
    window.dispatchEvent(new CustomEvent('openMobileFilters'));
  };


  const isActive = (path: string) => {
    // Handle root path redirect to map
    if (path === '/' && (location.pathname === '/' || location.pathname === '/wingman' || location.pathname === '/wingman/')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b safe-area-top sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 safe-area-left safe-area-right">
        <div className="flex justify-between items-center h-16 min-h-[4rem] px-2">
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

            {/* Sign In temporarily disabled */}
            <Unauthenticated>
              <SignInButton />
            </Unauthenticated>  
            <Authenticated>
              <UserButton />
            </Authenticated>
          </div>

          {/* Mobile menu buttons */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              to="/donate"
              className={`flex items-center px-2 py-2 rounded-md text-sm font-medium ${
                isActive('/donate') 
                  ? 'bg-wingman-pink text-white' 
                  : 'text-gray-600 hover:text-wingman-pink hover:bg-wingman-pink hover:bg-opacity-10'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </Link>
            
            {/* User Authentication */}
            <Unauthenticated>
              <SignInButton>
                <button className="flex items-center px-2 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-wingman-purple hover:bg-wingman-purple hover:bg-opacity-10">
                  <User className="w-5 h-5" />
                </button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <UserButton />
            </Authenticated>
            
            {isActive('/') && (
              <button
                onClick={handleMobileFilterClick}
                className="flex items-center px-2 py-2 rounded-md text-sm font-medium text-wingman-purple hover:text-wingman-purple-light"
              >
                <Filter className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}