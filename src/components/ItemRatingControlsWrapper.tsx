import ItemRatingControls from './ItemRatingControls';
import { useSingleItemData } from '../hooks/useItemData';
import type { Id } from '../../convex/_generated/dataModel';

interface ItemRatingControlsWrapperProps {
  itemId: Id<"locationItems">;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Wrapper component for ItemRatingControls that handles individual item queries
 * Use this when you need rating controls for a single item.
 * For multiple items, prefer using the batch queries with ItemRatingControls directly.
 */
export default function ItemRatingControlsWrapper({ 
  itemId, 
  size = 'md' 
}: ItemRatingControlsWrapperProps) {
  const { 
    userRating, 
    isFavorited, 
    averageRating, 
    ratingCount, 
    isLoading 
  } = useSingleItemData(itemId);

  if (isLoading) {
    return <div className="text-gray-500 text-sm">Loading...</div>;
  }

  return (
    <ItemRatingControls
      itemId={itemId}
      size={size}
      userRating={userRating}
      isFavorited={isFavorited}
      averageRating={averageRating}
      ratingCount={ratingCount}
    />
  );
}