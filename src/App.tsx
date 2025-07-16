import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ReturnsPage from './pages/ReturnsPage';
import UserProfilePage from './pages/UserProfilePage';
import MessagesPage from './pages/MessagesPage';
import SellerProfilePage from './pages/SellerProfilePage';
import LoginPage from './pages/LoginPage';
import SellerDashboard from './pages/SellerDashboard';
import ContactSellerModal from './components/ContactSellerModal';
import AuthModal from './components/AuthModal';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';

function App() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const openContactModal = (product: any) => {
    setSelectedProduct(product);
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
    setSelectedProduct(null);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthProvider>
      <ProductProvider>
        <CartProvider>
          <OrderProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 flex flex-col">
                <Routes>
                  {/* Seller Dashboard Routes */}
                  <Route path="/seller/*" element={<SellerDashboard />} />
                  
                  {/* Public Routes */}
                  <Route path="/*" element={
                    <>
                      <Navbar onAuthClick={openAuthModal} />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<HomePage />} />
                          <Route 
                            path="/product/:id" 
                            element={<ProductDetailPage onContactSeller={openContactModal} />} 
                          />
                          <Route path="/cart" element={<CartPage />} />
                          <Route path="/checkout" element={<CheckoutPage />} />
                          <Route path="/orders" element={<MyOrdersPage />} />
                          <Route path="/returns" element={<ReturnsPage />} />
                          <Route path="/profile" element={<UserProfilePage />} />
                          <Route path="/messages" element={<MessagesPage />} />
                          <Route path="/seller/:id" element={<SellerProfilePage />} />
                          <Route path="/login" element={<LoginPage />} />
                        </Routes>
                      </main>
                      <Footer />
                    </>
                  } />
                </Routes>
                
                <ContactSellerModal 
                  isOpen={isContactModalOpen}
                  onClose={closeContactModal}
                  product={selectedProduct}
                />
                
                <AuthModal 
                  isOpen={isAuthModalOpen}
                  onClose={closeAuthModal}
                />
              </div>
            </Router>
          </OrderProvider>
        </CartProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;