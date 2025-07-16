import React, { useState, useEffect } from 'react';
import { X, DollarSign, MapPin, Package, Star } from 'lucide-react';

interface FilterComponentProps {
  categories: string[];
  conditions: string[];
  onFilterChange: (filters: any) => void;
  initialFilters: {
    category: string;
    condition: string;
    priceRange: { min: number; max: number };
    city: string;
  };
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  categories,
  conditions,
  onFilterChange,
  initialFilters
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: numValue
      }
    }));
  };

  const resetFilters = () => {
    const resetFilters = {
      category: 'All',
      condition: 'All',
      priceRange: { min: 0, max: 1000 },
      location: ''
    };
    setFilters(resetFilters);
    setSortBy('newest');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            Advanced Filters
          </h3>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
              Price Range
            </label>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min || ''}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max || ''}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>${filters.priceRange.min}</span>
                <span>${filters.priceRange.max}</span>
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Star className="w-4 h-4 mr-1 text-gray-500" />
              Condition
            </label>
            <select
              value={filters.condition}
              onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {conditions.map(condition => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-gray-500" />
              City
            </label>
            <input
              type="text"
              placeholder="Enter city or area"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Tags */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Under $50', action: () => setFilters(prev => ({ ...prev, priceRange: { min: 0, max: 50 } })) },
              { label: 'New Items', action: () => setFilters(prev => ({ ...prev, condition: 'New' })) },
              { label: 'Electronics', action: () => setFilters(prev => ({ ...prev, category: 'Electronics' })) },
              { label: 'Books', action: () => setFilters(prev => ({ ...prev, category: 'Books' })) },
            ].map((tag, index) => (
              <button
                key={index}
                onClick={tag.action}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterComponent;