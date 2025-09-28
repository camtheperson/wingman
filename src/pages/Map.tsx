import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import { Filter, Search, Star, Heart, X, MapPin } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import Filters from '../components/Filters';
import 'leaflet/dist/leaflet.css';

// Type definitions based on Convex schema
type LocationItem = Doc<'locationItems'> & {
  averageRating?: number;
};

type LocationWithItems = Doc<'locations'> & {
  items?: LocationItem[];
  hours?: Doc<'locationHours'>[];
  averageRating?: number;
  isOpenNow?: boolean;
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
  const [selectedLocation, setSelectedLocation] = useState<LocationWithItems | null>(null);
  const [hoveredRating, setHoveredRating] = useState<string | null>(null);

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
    return userRatings?.find(r => r.itemId === itemId)?.rating || 0;
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
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r overflow-y-auto">
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
      <div className="flex-1 relative">
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
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-80 overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedLocation.restaurantName}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedLocation.neighborhood}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{selectedLocation.address}</p>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {selectedLocation.items && selectedLocation.items.length > 0 && (
                <div className="space-y-4 mt-4">
                  {selectedLocation.items.map((item: LocationItem) => {
                    const userRating = getUserRating(item._id);
                    const isFav = isFavorited(item._id);
                    
                    return (
                      <div key={item._id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                        <div className="flex gap-3">
                          {item.image && (
                            <div className="flex-shrink-0">
                              <img
                                src={item.image}
                                alt={item.itemName}
                                className="w-20 h-20 object-cover rounded-lg"
                                loading="lazy"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-wingman-orange mb-1">{item.itemName}</h4>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                            )}
                            
                            <div className="flex items-center gap-2 mb-2">
                              {item.glutenFree && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  GF
                                </span>
                              )}
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded capitalize">
                                {item.type}
                              </span>
                            </div>
                            
                            {/* Rating and Favorite Controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-700 mr-1">Rate:</span>
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
                                        <Star className={`w-4 h-4 ${
                                          shouldHighlight ? 'text-yellow-200' : 'text-gray-300'
                                        }`} />
                                        
                                        {(filled || halfFilled || shouldHighlight) && (
                                          <Star
                                            className={`w-4 h-4 fill-current absolute top-0 left-0 ${
                                              shouldHighlight ? 'text-yellow-300' : 'text-yellow-400'
                                            }`}
                                            style={{
                                              clipPath: halfFilled && !shouldHighlight ? 'inset(0 50% 0 0)' : 'none'
                                            }}
                                          />
                                        )}
                                        
                                        {/* Half-star click areas */}
                                        <div 
                                          className="absolute top-0 left-0 w-2 h-4 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRatingClick(item._id, starNumber - 0.5);
                                          }}
                                        />
                                        <div 
                                          className="absolute top-0 right-0 w-2 h-4 cursor-pointer"
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
                                  <span className="text-sm text-gray-500 ml-1">({userRating})</span>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleFavoriteClick(item._id)}
                                className={`p-2 rounded-full transition-colors ${
                                  isFav 
                                    ? 'text-red-500 hover:text-red-600' 
                                    : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
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
      </div>
    </div>
  );
}