import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Filter, Search, X } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import Filters from '../components/Filters';
import RestaurantInfo from '../components/RestaurantInfo';
import RestaurantHours from '../components/RestaurantHours';
import WingItemDisplay from '../components/WingItemDisplay';
import type { LocationWithItems, LocationItem, JsonLocationPin } from '../types';
import itemsData from '../../data/items.json';
import 'leaflet/dist/leaflet.css';



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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [glutenFree, setGlutenFree] = useState(false);
  const [allowMinors, setAllowMinors] = useState(false);
  const [allowTakeout, setAllowTakeout] = useState(false);
  const [allowDelivery, setAllowDelivery] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationWithItems | null>(null);
  const selectedLocationRef = useRef(selectedLocation);
  
  // Keep ref in sync with state
  selectedLocationRef.current = selectedLocation;


  // Listen for mobile filter button clicks from Navigation
  useEffect(() => {
    const handleMobileFilterClick = () => {
      setShowMobileFilters(true);
    };
    
    window.addEventListener('openMobileFilters', handleMobileFilterClick);
    return () => window.removeEventListener('openMobileFilters', handleMobileFilterClick);
  }, []);



  // Process JSON data to create fallback pins with filtering
  const fallbackPins: JsonLocationPin[] = useMemo(() => {
    // Type the imported JSON data
    interface JsonItem {
      restaurantName: string;
      neighborhood: string;
      latitude: number;
      longitude: number;
      address: string;
      type?: string;
      glutenFree?: boolean;
      allowMinors?: boolean;
      allowTakeout?: boolean;
      allowDelivery?: boolean;
      purchaseLimits?: boolean;
      hours?: Array<{
        dayOfWeek: string;
        date: string;
        hours: string;
      }>;
    }
    
    // Note: "Open now" filter is disabled for immediate pins since it requires
    // complex timezone logic. The detailed pins from Convex handle this properly.
    
    // Group items by restaurant to match Convex query logic
    interface LocationGroup {
      restaurantName: string;
      neighborhood: string;
      latitude: number;
      longitude: number;
      address: string;
      allowMinors?: boolean;
      allowTakeout?: boolean;
      allowDelivery?: boolean;
      purchaseLimits?: boolean;
      hours?: JsonItem['hours'];
      items: JsonItem[];
    }
    
    const locationMap: Record<string, LocationGroup> = {};
    
    // Group all items by restaurant
    (itemsData as JsonItem[]).forEach((item) => {
      if (item.latitude && item.longitude && item.restaurantName) {
        const key = item.restaurantName;
        
        if (!locationMap[key]) {
          locationMap[key] = {
            restaurantName: item.restaurantName,
            neighborhood: item.neighborhood,
            latitude: item.latitude,
            longitude: item.longitude,
            address: item.address,
            allowMinors: item.allowMinors,
            allowTakeout: item.allowTakeout,
            allowDelivery: item.allowDelivery,
            purchaseLimits: item.purchaseLimits,
            hours: item.hours,
            items: []
          };
        }
        
        locationMap[key].items.push(item);
      }
    });
    
    const pins: JsonLocationPin[] = [];
    
    // Apply filters following the same logic as Convex query
    Object.values(locationMap).forEach((location: LocationGroup) => {
      // Apply location-level filters
      const matchesSearch = !searchTerm || 
        location.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesNeighborhood = !selectedNeighborhood || location.neighborhood === selectedNeighborhood;
      
      const matchesAllowMinors = !allowMinors || location.allowMinors === true;
      
      const matchesAllowTakeout = !allowTakeout || location.allowTakeout === true;
      
      const matchesAllowDelivery = !allowDelivery || location.allowDelivery === true;
      
      // Note: isOpenNow and favoritesOnly filters are handled by Convex backend
      
      if (!matchesSearch || !matchesNeighborhood || !matchesAllowMinors || 
          !matchesAllowTakeout || !matchesAllowDelivery) {
        return;
      }
      
      // Apply item-level filters
      let hasMatchingItems = true;
      if (glutenFree || selectedType) {
        const matchingItems = location.items.filter((item: JsonItem) => {
          const itemMatchesGlutenFree = !glutenFree || item.glutenFree === true;
          const itemMatchesType = !selectedType || item.type === selectedType;
          return itemMatchesGlutenFree && itemMatchesType;
        });
        
        hasMatchingItems = matchingItems.length > 0;
      }
      
      if (hasMatchingItems) {
        pins.push({
          restaurantName: location.restaurantName,
          neighborhood: location.neighborhood,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address
        });
      }
    });
    
    return pins;
  }, [searchTerm, selectedNeighborhood, glutenFree, allowMinors, allowTakeout, allowDelivery, selectedType]);

  // Use lightweight pins query for map markers only
  const optimizedPins = useQuery(api.locations.getLocationPins, {
    searchTerm: searchTerm || undefined,
    neighborhood: selectedNeighborhood || undefined,
    glutenFree: glutenFree || undefined,
    allowMinors: allowMinors || undefined,
    allowTakeout: allowTakeout || undefined,
    allowDelivery: allowDelivery || undefined,
    isOpenNow: isOpenNow || undefined,
    type: selectedType ? selectedType as 'meat' | 'vegetarian' | 'vegan' : undefined,
    favoritesOnly: favoritesOnly || undefined,
  });

  const locations = useQuery(api.locations.getLocations, {
    searchTerm: searchTerm || undefined,
    neighborhood: selectedNeighborhood || undefined,
    glutenFree: glutenFree || undefined,
    allowMinors: allowMinors || undefined,
    allowTakeout: allowTakeout || undefined,
    allowDelivery: allowDelivery || undefined,
    isOpenNow: isOpenNow || undefined,
    type: selectedType ? selectedType as 'meat' | 'vegetarian' | 'vegan' : undefined,
    favoritesOnly: favoritesOnly || undefined,
    limit: 100, // Increase limit to ensure we get all locations
    offset: 0,
  });

  const neighborhoods = useQuery(api.locations.getNeighborhoods, {});

  // Get favorited items for the current user
  const favoriteItems = useQuery(api.favorites.getFavorites, {});

  // Use optimized pins when available, fallback to JSON processing
  const finalPins: JsonLocationPin[] = useMemo(() => {
    // Use optimizedPins if the query has completed (even if it returns empty array)
    // Only fallback to JSON processing if optimizedPins is undefined (query not completed)
    if (optimizedPins !== undefined) {
      return optimizedPins.map(pin => ({
        _id: pin._id,
        restaurantName: pin.restaurantName,
        neighborhood: pin.neighborhood,
        latitude: pin.latitude!,
        longitude: pin.longitude!,
        address: pin.address,
      }));
    }
    return fallbackPins;
  }, [optimizedPins, fallbackPins]);

  // Clear favorites filter when user logs out (favoriteItems becomes null/empty)
  useEffect(() => {
    if (favoritesOnly && (!favoriteItems || favoriteItems.length === 0)) {
      setFavoritesOnly(false);
    }
  }, [favoriteItems, favoritesOnly, setFavoritesOnly]);

  const handleLocationClick = (location: LocationWithItems) => {
    setSelectedLocation(location);
    // Update URL to include the selected location ID
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('location', location._id);
    setSearchParams(newSearchParams);
  };

  // Handle closing the selected location
  const handleLocationClose = () => {
    // Only update the URL - let the useEffect handle clearing the state
    // This prevents the race condition where state is cleared but URL still has location
    setSearchParams(params => {
      const newParams = new URLSearchParams(params);
      newParams.delete('location');
      return newParams;
    });
  };

  // Sync selected location with URL params
  useEffect(() => {
    const locationId = searchParams.get('location');
    const currentSelected = selectedLocationRef.current;
    
    if (locationId && locations) {
      // URL has a location ID - find and set it if different from current
      const location = locations.find(loc => loc && loc._id === locationId);
      if (location && (!currentSelected || currentSelected._id !== locationId)) {
        setSelectedLocation(location);
      }
      // Handle temp location upgrade: if current selection is a temp location,
      // try to find the matching real location by restaurant name and coordinates
      else if (currentSelected && currentSelected._id.startsWith('temp-') && !location) {
        const matchingLocation = locations.find(loc => 
          loc && 
          loc.restaurantName === currentSelected.restaurantName &&
          loc.latitude && loc.longitude &&
          Math.abs(loc.latitude - currentSelected.latitude!) < 0.001 && 
          Math.abs(loc.longitude - currentSelected.longitude!) < 0.001
        );
        
        if (matchingLocation) {
          // Upgrade temp location to real location
          setSelectedLocation(matchingLocation);
          // Update URL with real location ID
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.set('location', matchingLocation._id);
          setSearchParams(newSearchParams);
        }
      }
    } else if (!locationId) {
      // URL has no location ID - clear selection if we have one
      if (currentSelected) {
        setSelectedLocation(null);
      }
    }
  }, [searchParams, locations, setSearchParams]); // Now we can exclude selectedLocation from deps

  // Check if a location has any favorited items
  const locationHasFavorites = (location: LocationWithItems): boolean => {
    if (!favoriteItems || !location.items) return false;
    
    const favoriteItemIds = new Set(favoriteItems.map(fav => fav.itemId));
    return location.items.some(item => favoriteItemIds.has(item._id));
  };

  const filteredLocations = locations?.filter((location) => 
    location != null && location.latitude != null && location.longitude != null
  ) || [];
  


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
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              favoritesOnly={favoritesOnly}
              setFavoritesOnly={setFavoritesOnly}
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
          {finalPins.map((pin, index) => {
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
              icon={
                selectedLocation?._id === location._id 
                  ? favoriteMarkerIcon 
                  : locationHasFavorites(location)
                    ? favoriteMarkerIcon
                    : defaultMarkerIcon
              }
              eventHandlers={{
                click: () => handleLocationClick(location),
              }}
            />
          ))}
        </MapContainer>

        {/* Location Details Overlay */}
        {selectedLocation && (
          <>
            {/* Mobile: Full screen overlay */}
            <div className="md:hidden fixed inset-0 bg-white z-20 flex flex-col mobile-footer-padding" style={{ top: '4rem' }}>
              {/* Mobile Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {selectedLocation.restaurantName}
                </h3>
                <button
                  onClick={handleLocationClose}
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
            
            {/* Desktop: Larger overlay with mobile-like structure */}
            <div className="hidden md:block absolute inset-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 flex flex-col">
              {/* Desktop Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
                <h3 className="text-xl font-semibold text-gray-900 truncate">
                  {selectedLocation.restaurantName}
                </h3>
                <button
                  onClick={handleLocationClose}
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
          </>
        )}
        
        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
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
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  favoritesOnly={favoritesOnly}
                  setFavoritesOnly={setFavoritesOnly}
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