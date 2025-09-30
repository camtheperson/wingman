import { Link, useLocation } from 'react-router-dom';
import { Map, List } from 'lucide-react';

export default function MobileFooter() {
  const location = useLocation();

  const isActive = (path: string) => {
    // Handle root path redirect to map
    if (path === '/' && (location.pathname === '/' || location.pathname === '/wingman' || location.pathname === '/wingman/')) {
      return true;
    }
    return location.pathname === path;
  };

  // Only show on Map and List pages
  const shouldShow = isActive('/') || isActive('/list');
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-2">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-3 px-4 text-xs font-medium transition-colors ${
            isActive('/') 
              ? 'text-wingman-purple bg-wingman-purple bg-opacity-5' 
              : 'text-gray-600 hover:text-wingman-purple'
          }`}
        >
          <Map className="w-6 h-6 mb-1" />
          <span>Map</span>
        </Link>
        
        <Link
          to="/list"
          className={`flex flex-col items-center justify-center py-3 px-4 text-xs font-medium transition-colors ${
            isActive('/list') 
              ? 'text-wingman-purple bg-wingman-purple bg-opacity-5' 
              : 'text-gray-600 hover:text-wingman-purple'
          }`}
        >
          <List className="w-6 h-6 mb-1" />
          <span>List</span>
        </Link>
      </div>
    </div>
  );
}