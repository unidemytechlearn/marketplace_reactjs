import React, { useState } from 'react';
import { X, Mail, MessageCircle, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

const ContactSellerModal: React.FC<ContactSellerModalProps> = ({ isOpen, onClose, product }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [contactMethod, setContactMethod] = useState('message');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !product) return null;

  const handleStartChat = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    onClose();
    navigate(`/messages?user=${product.seller.id}&product=${product.id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (contactMethod === 'message') {
      handleStartChat();
      return;
    }
    
    setIsSubmitting(true);

    // Simulate sending message
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setMessage('');
        onClose();
      }, 2000);
    }, 1000);
  };

  const handleClose = () => {
    setMessage('');
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Contact Seller</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <img
              src={product.image}
              alt={product.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{product.title}</h3>
              <p className="text-xl font-bold text-blue-600">
                ${product.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Sold by {product.seller.name}</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-gray-600">The seller will get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you like to contact the seller?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="message"
                      checked={contactMethod === 'message'}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Send a message</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="email"
                      checked={contactMethod === 'email'}
                      onChange={(e) => setContactMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Email directly</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {contactMethod === 'message' ? 'Your message' : 'Email subject'}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    contactMethod === 'message'
                      ? "Hi, I'm interested in your product..."
                      : "Interested in your product"
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Quick Messages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick messages
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Is this still available?",
                    "Can you negotiate the price?",
                    "When can I pick it up?",
                    "More details please"
                  ].map((quickMessage) => (
                    <button
                      key={quickMessage}
                      type="button"
                      onClick={() => setMessage(quickMessage)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                    >
                      {quickMessage}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                    isSubmitting || !message.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isSubmitting ? 'Sending...' : contactMethod === 'message' ? 'Start Chat' : 'Send Message'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSellerModal;