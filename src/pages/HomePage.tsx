import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Clock, Filter, Sliders, Settings } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import FilterComponent from '../components/FilterComponent';
import LocationModal from '../components/LocationModal';

const HomePage: React.FC = () => {
  const { products } = useProducts();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [cityFilter, setCityFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    city?: string;
    state?: string;
    pincode?: string;
  }>({});

  const categories = ['All', 'Books', 'Electronics', 'Furniture', 'Services', 'Clothing', 'Sports'];
  const conditions = ['All', 'New', 'Like New', 'Good', 'Fair', 'Poor'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesCondition = selectedCondition === 'All' || product.condition === selectedCondition;
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
    const matchesLocation = !cityFilter || 
      (product.city && product.city.toLowerCase().includes(cityFilter.toLowerCase())) ||
      (product.location && product.location.toLowerCase().includes(cityFilter.toLowerCase()));
    
    return matchesSearch && matchesCategory && matchesCondition && matchesPrice && matchesLocation;
  });

  const handleFilterChange = (filters: any) => {
    setSelectedCategory(filters.category);
    setSelectedCondition(filters.condition);
    setPriceRange(filters.priceRange);
    setCityFilter(filters.city || '');
  };

  const handleLocationSet = (location: { city: string; state: string; pincode: string }) => {
    setUserLocation(location);
    // You could also filter products by location here
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Find Everything You Need
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Buy and sell educational materials, electronics, furniture, and more in your local community.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative md:w-64">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Location..."
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Location Banner */}
        {userLocation.city && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 max-w-2xl mx-auto">
            <p className="text-blue-800 text-sm">
              Showing products from <strong>{userLocation.city}, {userLocation.state}</strong> and nearby areas
            </p>
          </div>
        )}
      </div>

      {/* Categories and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 md:gap-4">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Sliders className="w-4 h-4" />
          <span>Advanced Filters</span>
        </button>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <FilterComponent
          categories={categories}
          conditions={conditions}
          onFilterChange={handleFilterChange}
          initialFilters={{
            category: selectedCategory,
            condition: selectedCondition,
            priceRange,
            city: cityFilter
          }}
        />
      )}

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
          {userLocation.city && (
            <span className="ml-2 text-blue-600">
              in {userLocation.city}, {userLocation.state}
            </span>
          )}
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
          <Link
            to="/seller/post"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Post the first product
          </Link>
        </div>
      )}

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSet={handleLocationSet}
        initialLocation={userLocation}
      />
    </div>
  );
};

export default HomePage;