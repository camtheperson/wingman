import { useItemData } from '../hooks/useItemData';
import ItemCard from './ItemCard';
import type { Id } from '../../convex/_generated/dataModel';

interface ItemsListProps {
  items: Array<{
    _id: Id<"locationItems">;
    itemName: string;
    description?: string;
    altDescription?: string;
    type: 'meat' | 'vegetarian' | 'vegan';
    glutenFree: boolean;
    image?: string;
  }>;
  compact?: boolean;
}

export default function ItemsList({ items, compact = false }: ItemsListProps) {
  const itemIds = items.map(item => item._id);
  const { ratings, favorites, isLoading } = useItemData(itemIds);

  if (isLoading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {items.map((item) => {
        const itemRating = ratings[item._id];
        const isFavorited = favorites[item._id];
        
        return (
          <ItemCard
            key={item._id}
            item={item}
            compact={compact}
            userRating={itemRating?.userRating}
            isFavorited={isFavorited}
            averageRating={itemRating?.averageRating || 0}
            ratingCount={itemRating?.ratingCount || 0}
          />
        );
      })}
    </div>
  );
}