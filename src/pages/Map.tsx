import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { Filter, Search, Star, Heart, X, MapPin } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import Filters from '../components/Filters';
import itemsData from '../../data/items.json';
import 'leaflet/dist/leaflet.css';

// Type definitions based on Convex schema and JSON data
type LocationItem = Doc<'locationItems'> & {
  averageRating?: number;
};

type LocationWithItems = Doc<'locations'> & {
  items?: LocationItem[];
  hours?: Doc<'locationHours'>[];
  averageRating?: number;
  isOpenNow?: boolean;
};

// JSON data type for immediate pins
type JsonLocationPin = {
  restaurantName: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  address: string;
};

// Custom marker icons
const defaultMarkerIcon = new L.Icon({
  iconUrl: '/wingman/marker.png',
  iconRetinaUrl: '/wingman/marker.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  shadowSize: [40, 40]
});

const favoriteMarkerIcon = new L.Icon({
  iconUrl: '/wingman/marker-favorite.png',
  iconRetinaUrl: '/wingman/marker-favorite.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
  shadowSize: [40, 40]
});

// Immediate (loading) marker - slightly smaller to indicate it's temporary
const immediateMarkerIcon = new L.Icon({
  iconUrl: '/wingman/marker.png',
  iconRetinaUrl: '/wingman/marker.png',
  iconSize: [35, 35], // Slightly smaller
  iconAnchor: [17.5, 35],
  popupAnchor: [0, -35],
  shadowSize: [35, 35],
  className: 'immediate-marker' // Add CSS class for potential styling
});

// Map controller component for handling map interactions
function MapController({ selectedLocation }: { selectedLocation: LocationWithItems | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && selectedLocation.latitude && selectedLocation.longitude) {
      map.setView([selectedLocation.latitude, selectedLocation.longitude], 16, {
        animate: true,
        duration: 1
      });
    }
  }, [selectedLocation, map]);

  return null;
}

export default function Map() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [glutenFree, setGlutenFree] = useState(false);
  const [allowMinors, setAllowMinors] = useState(false);
  const [allowTakeout, setAllowTakeout] = useState(false);
  const [allowDelivery, setAllowDelivery] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithItems | null>(null);
  const [hoveredRating, setHoveredRating] = useState<string | null>(null);

  // Listen for mobile filter button clicks from Navigation
  useEffect(() => {
    const handleMobileFilterClick = () => {
      setShowMobileFilters(true);
    };
    
    window.addEventListener('openMobileFilters', handleMobileFilterClick);
    return () => window.removeEventListener('openMobileFilters', handleMobileFilterClick);
  }, []);

  // Process JSON data to create immediate pins with filtering
  const immediatePins: JsonLocationPin[] = useMemo(() => {
    const seenLocations = new Set<string>();
    const pins: JsonLocationPin[] = [];
    
    // Type the imported JSON data
    interface JsonItem {
      restaurantName: string;
      neighborhood: string;
      latitude: number;
      longitude: number;
      address: string;
      glutenFree?: boolean;
      allowMinors?: boolean;
      allowTakeout?: boolean;
      allowDelivery?: boolean;
    }
    
    (itemsData as JsonItem[]).forEach((item) => {
      if (item.latitude && item.longitude && item.restaurantName && !seenLocations.has(item.restaurantName)) {
        // Apply basic filters from search criteria
        const matchesSearch = !searchTerm || 
          item.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesNeighborhood = !selectedNeighborhood || item.neighborhood === selectedNeighborhood;
        
        if (matchesSearch && matchesNeighborhood) {
          seenLocations.add(item.restaurantName);
          pins.push({
            restaurantName: item.restaurantName,
            neighborhood: item.neighborhood,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address
          });
        }
      }
    });
    
    return pins;
  }, [searchTerm, selectedNeighborhood]);

  const locations = useQuery(api.locations.getLocations, {
    searchTerm: searchTerm || undefined,
    neighborhood: selectedNeighborhood || undefined,
    glutenFree: glutenFree || undefined,
    allowMinors: allowMinors || undefined,
    allowTakeout: allowTakeout || undefined,
    allowDelivery: allowDelivery || undefined,
    isOpenNow: isOpenNow || undefined,
  });

  const neighborhoods = useQuery(api.locations.getNeighborhoods, {});
  const currentUser = useQuery(api.users.getCurrentUser);
  const userFavorites = useQuery(api.users.getUserFavorites);
  const userRatings = useQuery(api.users.getUserRatings);
  
  // Mutations
  const rateItem = useMutation(api.users.rateItem);
  const toggleFavorite = useMutation(api.users.toggleFavorite);

  const handleLocationClick = (location: LocationWithItems) => {
    setSelectedLocation(location);
  };

  const filteredLocations = locations?.filter((location) => 
    location != null && location.latitude != null && location.longitude != null
  ) || [];
  
  // Helper function to get user's rating for an item
  const getUserRating = (itemId: string) => {
    return userRatings?.find((r: { itemId: string; rating: number }) => r.itemId === itemId)?.rating || 0;
  };
  
  // Helper function to check if item is favorited
  const isFavorited = (itemId: string) => {
    return userFavorites?.includes(itemId as Doc<'locationItems'>['_id']) || false;
  };
  
  // Handle rating click
  const handleRatingClick = async (itemId: string, rating: number) => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    
    try {
      await rateItem({ itemId: itemId as Doc<'locationItems'>['_id'], rating });
    } catch (error) {
      console.error('Failed to rate item:', error);
    }
  };
  
  // Handle favorite toggle
  const handleFavoriteClick = async (itemId: string) => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    
    try {
      await toggleFavorite({ itemId: itemId as Doc<'locationItems'>['_id'] });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:block md:w-1/3 bg-white border-r overflow-y-auto">
        {/* Search and Filters */}
        <div className="p-4 border-b">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </button>

          {showFilters && (
            <Filters
              selectedNeighborhood={selectedNeighborhood}
              setSelectedNeighborhood={setSelectedNeighborhood}
              glutenFree={glutenFree}
              setGlutenFree={setGlutenFree}
              allowMinors={allowMinors}
              setAllowMinors={setAllowMinors}
              allowTakeout={allowTakeout}
              setAllowTakeout={setAllowTakeout}
              allowDelivery={allowDelivery}
              setAllowDelivery={setAllowDelivery}
              isOpenNow={isOpenNow}
              setIsOpenNow={setIsOpenNow}
              neighborhoods={neighborhoods || []}
            />
          )}
        </div>

        {/* Locations List */}
        <div className="p-4">
          <div className="text-sm text-gray-500 mb-4">
            {locations?.length || 0} locations found
          </div>
          
          {locations?.map((location) => location && (
            <LocationCard
              key={location._id}
              location={location}
              onClick={() => handleLocationClick(location)}
              isSelected={selectedLocation?._id === location._id}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative w-full">
        <MapContainer
          center={[45.5152, -122.6784]} // Portland coordinates
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <MapController selectedLocation={selectedLocation} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* 
            Render immediate pins from JSON data for instant loading.
            These show up immediately while detailed data loads from Convex.
            They are slightly smaller and faded to indicate they're temporary.
          */}
          {immediatePins.map((pin, index) => {
            // Check if this pin has detailed data loaded from Convex
            // Use a more precise coordinate match to avoid duplicate pins
            const detailedLocation = filteredLocations.find(loc => 
              loc && 
              Math.abs(loc.latitude! - pin.latitude) < 0.0001 && 
              Math.abs(loc.longitude! - pin.longitude) < 0.0001 &&
              loc.restaurantName === pin.restaurantName
            );
            
            // Only render immediate pin if detailed version isn't available yet
            if (!detailedLocation) {
              return (
                <Marker
                  key={`immediate-${index}`}
                  position={[pin.latitude, pin.longitude]}
                  icon={immediateMarkerIcon}
                  eventHandlers={{
                    click: () => {
                      // Create a temporary location object for display
                      const tempLocation = {
                        _id: `temp-${index}`,
                        restaurantName: pin.restaurantName,
                        neighborhood: pin.neighborhood,
                        address: pin.address,
                        latitude: pin.latitude,
                        longitude: pin.longitude,
                        items: [],
                        hours: [],
                        _creationTime: Date.now(),
                        allowMinors: false,
                        allowTakeout: false,
                        allowDelivery: false,
                        purchaseLimits: false,
                        phone: null,
                        website: null,
                        updatedAt: Date.now()
                      } as unknown as LocationWithItems;
                      handleLocationClick(tempLocation);
                    },
                  }}
                />
              );
            }
            return null;
          })}
          
          {/* Render detailed pins from Convex data (these will overlay the immediate pins) */}
          {filteredLocations.map((location) => location && (
            <Marker
              key={location._id}
              position={[location.latitude!, location.longitude!]}
              icon={selectedLocation?._id === location._id ? favoriteMarkerIcon : defaultMarkerIcon}
              eventHandlers={{
                click: () => handleLocationClick(location),
              }}
            />
          ))}
        </MapContainer>

        {/* Location Details Overlay */}
        {selectedLocation && (
          <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-[70vh] md:max-h-80 overflow-y-auto">
            <div className="p-3 md:p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-2">
                  <h3 className="text-xl md:text-lg font-semibold text-gray-900 leading-tight">
                    {selectedLocation.restaurantName}
                  </h3>
                  <div className="flex items-center text-base md:text-sm text-gray-600 mt-2">
                    <MapPin className="w-5 h-5 md:w-4 md:h-4 mr-1 flex-shrink-0" />
                    <span className="break-words">{selectedLocation.neighborhood}</span>
                  </div>
                  <p className="text-sm md:text-xs text-gray-500 mt-1 break-words">{selectedLocation.address}</p>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600 p-2 flex-shrink-0"
                >
                  <X className="w-6 h-6 md:w-5 md:h-5" />
                </button>
              </div>
              
              {/* Show loading state for temporary locations */}
              {selectedLocation._id.startsWith('temp-') && (
                <div className="mt-4 text-center text-gray-500">
                  <p>Loading detailed information...</p>
                </div>
              )}
              
              {selectedLocation.items && selectedLocation.items.length > 0 && (
                <div className="space-y-4 mt-4">
                  {selectedLocation.items.map((item: LocationItem) => {
                    const userRating = getUserRating(item._id);
                    const isFav = isFavorited(item._id);
                    
                    return (
                      <div key={item._id} className="border-b border-gray-100 last:border-b-0 pb-4 md:pb-4 last:pb-0">
                        <div className="flex gap-3 md:gap-3">
                          {item.image && (
                            <div className="flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.itemName}
                                className="w-24 h-24 md:w-20 md:h-20 object-cover rounded-lg"
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-wingman-orange mb-2 text-lg md:text-base leading-tight">{item.itemName}</h4>
                            {item.description && (
                              <p className="text-base md:text-sm text-gray-600 mb-3 line-clamp-3 md:line-clamp-2 leading-relaxed">{item.description}</p>
                            )}
                            
                            <div className="flex items-center gap-2 mb-3">
                              {item.glutenFree && (
                                <span className="text-sm md:text-xs bg-green-100 text-green-800 px-3 py-1 md:px-2 md:py-0.5 rounded font-medium">
                                  GF
                                </span>
                              )}
                              <span className="text-sm md:text-xs bg-gray-100 text-gray-700 px-3 py-1 md:px-2 md:py-0.5 rounded capitalize font-medium">
                                {item.type}
                              </span>
                            </div>
                            
                            {/* Rating and Favorite Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base md:text-sm text-gray-700 font-medium">Rate:</span>
                                <div 
                                  className="flex items-center space-x-0.5"
                                  onMouseLeave={() => setHoveredRating(null)}
                                >
                                  {[1, 2, 3, 4, 5].map((starNumber) => {
                                    const filled = userRating >= starNumber;
                                    const halfFilled = userRating >= starNumber - 0.5 && userRating < starNumber;
                                    const shouldHighlight = hoveredRating === item._id + starNumber;
                                    
                                    return (
                                      <div
                                        key={starNumber}
                                        className="relative cursor-pointer"
                                        onMouseEnter={() => setHoveredRating(item._id + starNumber)}
                                        onClick={() => handleRatingClick(item._id, starNumber)}
                                      >
                                        <Star className={`w-6 h-6 md:w-4 md:h-4 ${
                                          shouldHighlight ? 'text-yellow-200' : 'text-gray-300'
                                        }`} />
                                        
                                        {(filled || halfFilled || shouldHighlight) && (
                                          <Star
                                            className={`w-6 h-6 md:w-4 md:h-4 fill-current absolute top-0 left-0 ${
                                              shouldHighlight ? 'text-yellow-300' : 'text-yellow-400'
                                            }`}
                                            style={{
                                              clipPath: halfFilled && !shouldHighlight ? 'inset(0 50% 0 0)' : 'none'
                                            }}
                                          />
                                        )}
                                        
                                        {/* Half-star click areas */}
                                        <div 
                                          className="absolute top-0 left-0 w-3 h-6 md:w-2 md:h-4 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRatingClick(item._id, starNumber - 0.5);
                                          }}
                                        />
                                        <div 
                                          className="absolute top-0 right-0 w-3 h-6 md:w-2 md:h-4 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRatingClick(item._id, starNumber);
                                          }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                                {userRating > 0 && (
                                  <span className="text-base md:text-sm text-gray-500 ml-2">({userRating})</span>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleFavoriteClick(item._id)}
                                className={`p-3 md:p-2 rounded-full transition-colors ${
                                  isFav 
                                    ? 'text-red-500 hover:text-red-600' 
                                    : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <Heart className={`w-6 h-6 md:w-5 md:h-5 ${isFav ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div className="bg-white w-full max-h-[80vh] rounded-t-xl overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Filters & Search</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Filters */}
                <Filters
                  selectedNeighborhood={selectedNeighborhood}
                  setSelectedNeighborhood={setSelectedNeighborhood}
                  glutenFree={glutenFree}
                  setGlutenFree={setGlutenFree}
                  allowMinors={allowMinors}
                  setAllowMinors={setAllowMinors}
                  allowTakeout={allowTakeout}
                  setAllowTakeout={setAllowTakeout}
                  allowDelivery={allowDelivery}
                  setAllowDelivery={setAllowDelivery}
                  isOpenNow={isOpenNow}
                  setIsOpenNow={setIsOpenNow}
                  neighborhoods={neighborhoods || []}
                />
                
                {/* Results count */}
                <div className="text-base text-gray-500 mt-6 mb-4">
                  {locations?.length || 0} locations found
                </div>
                
                {/* Quick actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 bg-wingman-purple text-white py-3 px-4 rounded-lg font-medium text-lg hover:bg-wingman-purple-light transition-colors"
                  >
                    View Map
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}