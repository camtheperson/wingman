import ItemRatingControls from './ItemRatingControls';
import type { LocationItem } from '../types';

interface WingItemDisplayProps {
  item: LocationItem;
  imageSize?: 'small' | 'medium' | 'large';
  showFullDetails?: boolean;
}

export default function WingItemDisplay({ 
  item, 
  imageSize = 'medium',
  showFullDetails = true 
}: WingItemDisplayProps) {
  // For mobile, we still want fixed height with cropping for consistency
  // For desktop (medium), we want natural aspect ratio
  const imageSizeClasses = {
    small: 'h-32 object-cover',
    medium: 'object-contain max-h-96', // Natural aspect ratio for desktop
    large: 'h-100 object-cover' // Fixed height for mobile
  };

  const textSizeClasses = {
    title: showFullDetails ? 'text-xl' : 'text-lg',
    description: showFullDetails ? 'text-base' : 'text-sm',
    header: showFullDetails ? 'text-sm' : 'text-xs'
  };

  return (
    <div className="bg-white border-b border-gray-200 last:border-b-0">
      {/* Image */}
      {item.image && (
        <div className="w-full flex justify-center bg-gray-50">
          <img
            src={item.image}
            alt={item.itemName}
            className={`w-full ${imageSizeClasses[imageSize]}`}
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
            }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <h4 className={`font-semibold text-wingman-orange mb-3 leading-tight ${textSizeClasses.title}`}>
          {item.itemName}
        </h4>
        
        {/* Rating and Favorite - Prominent placement */}
        <div className="mb-4">
          <ItemRatingControls 
            itemId={item._id} 
            size={showFullDetails ? 'lg' : 'md'} 
          />
        </div>
        
        {/* Descriptions */}
        {item.description && (
          <div className="mb-4">
            <h5 className={`font-semibold text-gray-700 uppercase tracking-wide mb-2 ${textSizeClasses.header}`}>
              What's on them...
            </h5>
            <p className={`text-gray-700 leading-relaxed ${textSizeClasses.description}`}>
              {item.description}
            </p>
          </div>
        )}
        
        {item.altDescription && (
          <div className="mb-4">
            <h5 className={`font-semibold text-gray-700 uppercase tracking-wide mb-2 ${textSizeClasses.header}`}>
              What they're saying...
            </h5>
            <p className={`text-gray-700 leading-relaxed ${textSizeClasses.description}`}>
              {item.altDescription}
            </p>
          </div>
        )}
        
        {/* Dietary Tags */}
        <div className="flex items-center gap-2">
          {item.glutenFree && (
            <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
              Gluten Free
            </span>
          )}
          <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full capitalize font-medium">
            {item.type}
          </span>
        </div>
      </div>
    </div>
  );
}