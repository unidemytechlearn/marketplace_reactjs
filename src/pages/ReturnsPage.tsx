import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Package, CheckCircle, Clock } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';

const ReturnsPage: React.FC = () => {
  const { orders, requestReturn } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  // Get delivered orders that can be returned
  const returnableOrders = orders.filter(order => order.status === 'delivered');

  const returnReasons = [
    'Item not as described',
    'Damaged during shipping',
    'Wrong item received',
    'Quality issues',
    'Changed my mind',
    'Other'
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleReturnRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !returnReason) return;

    setIsSubmitting(true);

    // Simulate return request processing
    setTimeout(() => {
      requestReturn(selectedItem.orderId, selectedItem.id, returnReason);
      setIsSubmitting(false);
      setSelectedItem(null);
      setReturnReason('');
      // Show success message or redirect
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Returns & Refunds</h1>
        <p className="text-gray-600">
          Request returns for items delivered within the last 30 days
        </p>
      </div>

      {/* Return Policy */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Return Policy</h2>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Items can be returned within 30 days of delivery</li>
          <li>• Items must be in original condition with packaging</li>
          <li>• Refunds will be processed within 5-7 business days</li>
          <li>• Return shipping is free for damaged or incorrect items</li>
        </ul>
      </div>

      {/* Returnable Items */}
      {returnableOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No returnable items</h2>
          <p className="text-gray-600 mb-8">
            You don't have any delivered orders that are eligible for return
          </p>
          <button
            onClick={() => navigate('/orders')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            View All Orders
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Eligible for Return</h2>
          
          {returnableOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Order #{order.id}</span>
                  <span className="text-sm text-gray-600">
                    Delivered on {formatDate(order.orderDate)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Return deadline: {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                </div>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Sold by {item.seller.name} • Qty: {item.quantity}
                      </p>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItem({ ...item, orderId: order.id })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Request Return
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return Request Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Return</h2>
              
              {/* Item Info */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 line-clamp-1">
                    {selectedItem.title}
                  </h3>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatPrice(selectedItem.price * selectedItem.quantity)}
                  </div>
                </div>
              </div>

              {/* Return Form */}
              <form onSubmit={handleReturnRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for return
                  </label>
                  <select
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a reason</option>
                    {returnReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !returnReason}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      isSubmitting || !returnReason
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Clock className="animate-spin -ml-1 mr-3 h-4 w-4" />
                        Processing...
                      </span>
                    ) : (
                      'Submit Return Request'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      setReturnReason('');
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsPage;