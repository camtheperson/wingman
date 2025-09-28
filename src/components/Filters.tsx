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
    <div className="mt-4 p-4 md:p-4 bg-gray-50 rounded-lg space-y-6 md:space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold md:font-medium text-lg md:text-base text-gray-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-base md:text-sm text-wingman-purple hover:text-wingman-purple-light transition-colors px-2 py-1"
        >
          Clear All
        </button>
      </div>

      {/* Neighborhood Filter */}
      <div>
        <label className="block text-base md:text-sm font-medium text-gray-700 mb-2 md:mb-1">
          Neighborhood
        </label>
        <select
          value={selectedNeighborhood}
          onChange={(e) => setSelectedNeighborhood(e.target.value)}
          className="w-full px-4 py-3 md:px-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
      <div className="space-y-4 md:space-y-2">
        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={glutenFree}
            onChange={(e) => setGlutenFree(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Gluten Free Options</span>
        </label>

        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={allowMinors}
            onChange={(e) => setAllowMinors(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Family Friendly</span>
        </label>

        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={allowTakeout}
            onChange={(e) => setAllowTakeout(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Takeout Available</span>
        </label>

        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={allowDelivery}
            onChange={(e) => setAllowDelivery(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Delivery Available</span>
        </label>

        <label className="flex items-center py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isOpenNow}
            onChange={(e) => setIsOpenNow(e.target.checked)}
            className="mr-3 md:mr-2 w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-wingman-purple focus:ring-wingman-purple"
          />
          <span className="text-base md:text-sm text-gray-700 font-medium md:font-normal">Open Now</span>
        </label>
      </div>
    </div>
  );
}