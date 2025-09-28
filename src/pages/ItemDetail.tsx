import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Star, Heart, MapPin, Clock, Phone, Globe } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  
  const location = useQuery(api.locations.getLocationById, {
    id: id as Id<"locations">
  });

  if (!location) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {location.restaurantName}
        </h1>
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-5 h-5 mr-2" />
          <span>{location.neighborhood} • {location.address}</span>
        </div>
        
        {/* Restaurant Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          {location.allowMinors && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              Family Friendly
            </span>
          )}
          {location.allowTakeout && (
            <span className="bg-wingman-teal bg-opacity-10 text-wingman-teal px-3 py-1 rounded-full">
              Takeout Available
            </span>
          )}
          {location.allowDelivery && (
            <span className="bg-wingman-purple bg-opacity-10 text-wingman-purple px-3 py-1 rounded-full">
              Delivery Available
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Wing Items */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Wing Offerings</h2>
            <div className="space-y-6">
              {location.items?.map((item) => (
                <div key={item._id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex gap-6">
                    {/* Image */}
                    {item.image && (
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.itemName}
                          className="w-32 h-32 object-cover rounded-lg"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-wingman-orange">
                          {item.itemName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-wingman-pink transition-colors">
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="text-gray-700 mb-4">{item.description}</p>
                      )}
                  
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.glutenFree && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                              Gluten Free
                            </span>
                          )}
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm capitalize">
                            {item.type}
                          </span>
                        </div>
                        
                        {item.averageRating && item.averageRating > 0 && (
                          <div className="flex items-center">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(item.averageRating!)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {item.averageRating.toFixed(1)} ({item.ratingCount} reviews)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Rating Section */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Rate this item</h4>
                        <div className="flex items-center space-x-1 mb-3">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star className="w-6 h-6 text-gray-300 hover:text-yellow-400" />
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Write a review..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows={3}
                        />
                        <button className="mt-2 px-4 py-2 bg-wingman-orange text-white rounded-md hover:bg-wingman-orange-light transition-colors">
                          Submit Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hours */}
          {location.hours && location.hours.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Hours
              </h3>
              <div className="space-y-2">
                {location.hours.map((hour, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {hour.dayOfWeek} {hour.date}
                    </span>
                    <span className="text-gray-600">{hour.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Links */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm">{location.address}</span>
              </div>
              
              {location.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
                  <a href={`tel:${location.phone}`} className="text-sm hover:text-wingman-orange transition-colors">
                    {location.phone}
                  </a>
                </div>
              )}
              
              {location.website && (
                <div className="flex items-center text-gray-600">
                  <Globe className="w-5 h-5 mr-3 flex-shrink-0" />
                  <a 
                    href={location.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm hover:text-wingman-orange transition-colors"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-wingman-purple text-white rounded-md hover:bg-wingman-purple-light transition-colors">
              Get Directions
            </button>
          </div>

          {/* Map Preview */}
          {location.latitude && location.longitude && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
              <div className="aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                <MapPin className="w-8 h-8 text-gray-400" />
                <span className="ml-2 text-gray-500">Map Preview</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}