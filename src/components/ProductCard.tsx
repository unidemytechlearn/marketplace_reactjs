import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Heart, Eye } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  location: string;
  city?: string;
  state?: string;
  category: string;
  condition: string;
  description: string;
  image: string;
  postedAt: string;
  status: string;
  views?: number;
  seller: {
    id?: string;
    name: string;
    rating: number;
  };
}

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleSellerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.seller.id) {
      navigate(`/seller/${product.seller.id}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 group">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
        <div className="absolute top-3 left-3 flex flex-col space-y-1">
          <div className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium">
            {product.category}
          </div>
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${
            product.condition === 'New' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {product.condition}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(product.price)}
          </span>
          <div className="flex items-center text-gray-500 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            {formatTime(product.postedAt)}
          </div>
        </div>

        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          {product.city && product.state ? `${product.city}, ${product.state}` : product.location}
          {product.views && (
            <span className="ml-4 flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {product.views} views
            </span>
          )}
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2" title={product.description}>
          {product.description.length > 100 
            ? `${product.description.substring(0, 100)}...` 
            : product.description}
        </p>

        <div className="flex items-center justify-between">
          <button 
            onClick={handleSellerClick}
            className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
          >
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-600">{product.seller.name}</span>
          </button>
          
          <Link
            to={`/product/${product.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View More
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;