import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Search, Filter } from 'lucide-react';
import LocationCard from '../components/LocationCard';
import Filters from '../components/Filters';
import LocationDetailsModal from '../components/LocationDetailsModal';
import type { LocationWithItems } from '../types';

export default function List() {
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
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'neighborhood'>('name');
  const [selectedLocation, setSelectedLocation] = useState<LocationWithItems | null>(null);

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
  const favoriteItems = useQuery(api.favorites.getFavorites, {});

  // Clear favorites filter when user logs out
  useEffect(() => {
    if (favoritesOnly && (!favoriteItems || favoriteItems.length === 0)) {
      setFavoritesOnly(false);
    }
  }, [favoriteItems, favoritesOnly, setFavoritesOnly]);

  // Sort locations based on selected criteria
  const sortedLocations = locations?.filter(location => location != null).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.restaurantName.localeCompare(b.restaurantName);
      case 'rating':
        return (b.averageRating || 0) - (a.averageRating || 0);
      case 'neighborhood':
        return a.neighborhood.localeCompare(b.neighborhood);
      default:
        return 0;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wing Week Locations</h1>
        <p className="text-gray-600">
          Discover all the amazing wing offerings across Portland
        </p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search locations or wings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rating' | 'neighborhood')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="neighborhood">Sort by Neighborhood</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="max-w-md">
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
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          {sortedLocations?.length || 0} location{sortedLocations?.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Locations Grid */}
      {sortedLocations && sortedLocations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedLocations.map((location) => location && (
            <LocationCard
              key={location._id}
              location={location}
              onClick={() => {
                // Show location details in modal
                setSelectedLocation(location);
              }}
              isSelected={selectedLocation?._id === location._id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No locations found matching your criteria.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedNeighborhood('');
              setGlutenFree(false);
              setAllowMinors(false);
              setAllowTakeout(false);
              setAllowDelivery(false);
              setIsOpenNow(false);
              setSelectedType('');
              setFavoritesOnly(false);
            }}
            className="text-red-600 hover:text-red-700"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Location Details Modal */}
      <LocationDetailsModal 
        selectedLocation={selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />
    </div>
  );
}