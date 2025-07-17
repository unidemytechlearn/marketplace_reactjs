import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, Gift, Zap } from 'lucide-react';
import { getCategories, getProductsByCategory, type Category, type Product } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  useEffect(() => {
    loadCategories();
    
    // Check if category is specified in URL
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      loadProductsByCategory(categoryFromUrl);
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProductsByCategory = async (categoryName: string) => {
    setIsLoadingProducts(true);
    try {
      const data = await getProductsByCategory(categoryName);
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category.name);
    navigate(`/categories?category=${encodeURIComponent(category.name)}`);
    loadProductsByCategory(category.name);
  };

  const getCategoryIcon = (categoryName: string, isSpecial?: boolean) => {
    if (categoryName.includes('Donate') || categoryName.includes('Giveaway')) {
      return <Gift className="w-8 h-8" />;
    }
    if (categoryName.includes('Urgent') || categoryName.includes('Moving')) {
      return <Zap className="w-8 h-8" />;
    }
    
    const iconMap: { [key: string]: string } = {
      'Books': '📚',
      'Electronics': '📱',
      'Furniture': '🪑',
      'Clothing': '👕',
      'Sports': '⚽',
      'Services': '🔧'
    };
    
    const emoji = Object.keys(iconMap).find(key => categoryName.includes(key));
    return emoji ? <span className="text-3xl">{iconMap[emoji]}</span> : <Package className="w-8 h-8" />;
  };

  const getCategoryColor = (categoryName: string, isSpecial?: boolean) => {
    if (categoryName.includes('Donate') || categoryName.includes('Giveaway')) {
      return 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800';
    }
    if (categoryName.includes('Urgent') || categoryName.includes('Moving')) {
      return 'bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-800';
    }
    return 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {selectedCategory ? `${selectedCategory} Products` : 'Browse Categories'}
        </h1>
      </div>

      {!selectedCategory ? (
        /* Categories Grid */
        <div>
          <p className="text-gray-600 mb-8">
            Explore products by category or find special deals and donations
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${getCategoryColor(category.name, category.is_special)}`}
              >
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex-shrink-0">
                    {getCategoryIcon(category.name, category.is_special)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">
                      {category.name}
                    </h3>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-sm opacity-75 line-clamp-2">
                    {category.description}
                  </p>
                )}
                
                {category.is_special && (
                  <div className="mt-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded-full">
                      Special Category
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Products for Selected Category */
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {isLoadingProducts ? 'Loading...' : `${products.length} products found`}
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setProducts([]);
                navigate('/categories');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              View All Categories
            </button>
          </div>

          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to post a product in this category
              </p>
              <Link
                to="/seller/post"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Post Product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;