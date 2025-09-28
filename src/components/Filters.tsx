interface FiltersProps {
  selectedNeighborhood: string;
  setSelectedNeighborhood: (value: string) => void;
  glutenFree: boolean;
  setGlutenFree: (value: boolean) => void;
  allowMinors: boolean;
  setAllowMinors: (value: boolean) => void;
  allowTakeout: boolean;
  setAllowTakeout: (value: boolean) => void;
  allowDelivery: boolean;
  setAllowDelivery: (value: boolean) => void;
  isOpenNow: boolean;
  setIsOpenNow: (value: boolean) => void;
  neighborhoods: string[];
}

export default function Filters({
  selectedNeighborhood,
  setSelectedNeighborhood,
  glutenFree,
  setGlutenFree,
  allowMinors,
  setAllowMinors,
  allowTakeout,
  setAllowTakeout,
  allowDelivery,
  setAllowDelivery,
  isOpenNow,
  setIsOpenNow,
  neighborhoods,
}: FiltersProps) {
  const clearFilters = () => {
    setSelectedNeighborhood('');
    setGlutenFree(false);
    setAllowMinors(false);
    setAllowTakeout(false);
    setAllowDelivery(false);
    setIsOpenNow(false);
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-wingman-purple hover:text-wingman-purple-light transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Neighborhood Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Neighborhood
        </label>
        <select
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">All Neighborhoods</option>
          {neighborhoods.map((neighborhood) => (
            <option key={neighborhood} value={neighborhood}>
              {neighborhood}
            </option>
          ))}
        </select>
      </div>

      {/* Dietary & Accessibility Options */}
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={glutenFree}
            onChange={(e) => setGlutenFree(e.target.checked)}
            className="mr-2 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-sm text-gray-700">Gluten Free Options</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allowMinors}
            onChange={(e) => setAllowMinors(e.target.checked)}
            className="mr-2 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-sm text-gray-700">Family Friendly</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allowTakeout}
            onChange={(e) => setAllowTakeout(e.target.checked)}
            className="mr-2 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-sm text-gray-700">Takeout Available</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allowDelivery}
            onChange={(e) => setAllowDelivery(e.target.checked)}
            className="mr-2 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-sm text-gray-700">Delivery Available</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isOpenNow}
            onChange={(e) => setIsOpenNow(e.target.checked)}
            className="mr-2 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-sm text-gray-700">Open Now</span>
        </label>
      </div>
    </div>
  );
}