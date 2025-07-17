import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown, BookOpen, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onAuthClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onAuthClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  const categories = [
    'All Categories',
    'Books & Textbooks',
    'Electronics',
    'Furniture',
    'Services',
    'Clothing',
    'Sports & Recreation'
  ];

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900">Unidemy Global</span>
              <div className="text-xs text-blue-600 font-medium">Marketplace</div>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="flex w-full">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="h-12 px-4 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg flex items-center space-x-2 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm text-gray-700">All</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                
                {isCategoryOpen && (
                  <div className="absolute top-12 left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {categories.map((category) => (
                      <button
                        key={category}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => setIsCategoryOpen(false)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim()) {
                    navigate(`/?search=${encodeURIComponent(e.target.value)}`);
                  } else {
                    navigate('/');
                  }
                }}
                placeholder="Search for products..."
                className="flex-1 h-12 px-4 border-t border-b border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <button
                type="button"
                onClick={() => {
                  if (searchTerm.trim()) {
                    navigate(`/?search=${encodeURIComponent(searchTerm)}`);
                  }
                }}
                className="h-12 px-6 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  to="/seller" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Sell
                </Link>
                <Link 
                  to="/orders" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Orders
                </Link>
                <Link 
                  to="/messages" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Messages
                </Link>
                <Link 
                  to="/cart" 
                  className="relative text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      My Profile
                    </Link>
                    <Link 
                      to="/orders" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      My Orders
                    </Link>
                    <Link 
                      to="/messages" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Messages
                    </Link>
                    <Link 
                      to="/returns" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Returns
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.trim()) {
                  navigate(`/?search=${encodeURIComponent(e.target.value)}`);
                } else {
                  navigate('/');
                }
              }}
              placeholder="Search products..."
              className="flex-1 h-10 px-4 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => {
                if (searchTerm.trim()) {
                  navigate(`/?search=${encodeURIComponent(searchTerm)}`);
                }
              }}
              className="h-10 px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <div className="flex items-center space-x-3 px-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                  <Link 
                    to="/seller" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sell Products
                  </Link>
                  <Link 
                    to="/orders" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  <Link 
                    to="/messages" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  <Link 
                    to="/cart" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Cart ({cartItemCount})</span>
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors px-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-red-600 hover:text-red-700 font-medium transition-colors px-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onAuthClick();
                    setIsMenuOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors mx-2"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;