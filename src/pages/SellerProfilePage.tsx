import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Package, Eye, Star, MessageCircle } from 'lucide-react';
import { getSellerProfile, getSellerProducts, type SellerStats, type Product } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

const SellerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seller, setSeller] = useState<SellerStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (id) {
      loadSellerData();
    }
  }, [id]);

  const loadSellerData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const [sellerData, productsData] = await Promise.all([
        getSellerProfile(id),
        getSellerProducts(id, activeTab)
      ]);
      
      setSeller(sellerData);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading seller data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProducts();
    }
  }, [activeTab, id]);

  const loadProducts = async () => {
    if (!id) return;
    
    try {
      const productsData = await getSellerProducts(id, activeTab);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleMessageSeller = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages?user=${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  if (!seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Seller not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to listings</span>
      </button>

      {/* Seller Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              {seller.avatar_url ? (
                <img
                  src={seller.avatar_url}
                  alt={seller.full_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {seller.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Seller Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {seller.full_name}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {seller.city && seller.state && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{seller.city}, {seller.state}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Member since {formatDate(seller.member_since)}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>4.8 rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {user && user.id !== id && (
              <button
                onClick={handleMessageSeller}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message Seller</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{seller.total_products}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{seller.active_products}</div>
            <div className="text-sm text-gray-600">Active Listings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{seller.sold_products}</div>
            <div className="text-sm text-gray-600">Items Sold</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(seller.avg_views)}</div>
            <div className="text-sm text-gray-600">Avg. Views</div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'active'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active Listings ({seller.active_products})
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'sold'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sold Items ({seller.sold_products})
          </button>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} products
            </h3>
            <p className="text-gray-600">
              This seller doesn't have any {activeTab} products at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProfilePage;