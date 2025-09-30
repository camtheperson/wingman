import { X } from 'lucide-react';
import RestaurantInfo from './RestaurantInfo';
import RestaurantHours from './RestaurantHours';
import WingItemDisplay from './WingItemDisplay';
import type { LocationWithItems, LocationItem } from '../types';

interface LocationDetailsModalProps {
  selectedLocation: LocationWithItems | null;
  onClose: () => void;
}

export default function LocationDetailsModal({ selectedLocation, onClose }: LocationDetailsModalProps) {
  if (!selectedLocation) return null;

  return (
    <>
      {/* Mobile: Full screen overlay */}
      <div className="md:hidden fixed inset-0 bg-white z-30 flex flex-col mobile-footer-padding" style={{ top: '4rem' }}>
        {/* Mobile Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            {selectedLocation.restaurantName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Mobile Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Restaurant Info */}
          <RestaurantInfo location={selectedLocation} />
          
          {/* Show loading state for temporary locations */}
          {selectedLocation._id.startsWith('temp-') && (
            <div className="p-8 text-center text-gray-500">
              <p>Loading detailed information...</p>
            </div>
          )}
          
          {/* Items with large images on mobile */}
          {selectedLocation.items && selectedLocation.items.length > 0 && (
            <div className="space-y-0">
              {selectedLocation.items.map((item: LocationItem) => (
                <WingItemDisplay 
                  key={item._id} 
                  item={item} 
                  imageSize="large"
                  showFullDetails={true}
                />
              ))}
            </div>
          )}

          {/* Hours */}
          <RestaurantHours hours={selectedLocation.hours} />
        </div>
      </div>
      
      {/* Desktop: Modal with backdrop */}
      <div 
        className="hidden md:block fixed inset-0 bg-black bg-opacity-50 z-30 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col max-w-4xl w-full max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Desktop Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            {selectedLocation.restaurantName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Desktop Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Restaurant Info */}
          <RestaurantInfo location={selectedLocation} />
          
          {/* Show loading state for temporary locations */}
          {selectedLocation._id.startsWith('temp-') && (
            <div className="p-8 text-center text-gray-500">
              <p>Loading detailed information...</p>
            </div>
          )}
          
          {/* Items with medium-sized images on desktop */}
          {selectedLocation.items && selectedLocation.items.length > 0 && (
            <div className="space-y-0">
              {selectedLocation.items.map((item: LocationItem) => (
                <WingItemDisplay 
                  key={item._id} 
                  item={item} 
                  imageSize="medium"
                  showFullDetails={true}
                />
              ))}
            </div>
          )}

          {/* Hours */}
          <RestaurantHours hours={selectedLocation.hours} />
        </div>
        </div>
      </div>
    </>
  );
}