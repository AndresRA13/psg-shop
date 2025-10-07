import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/home';
import Login from '../../components/login';
import Register from '../../components/Register';
import ResetPassword from '../../components/ResetPassword';
import AdminPanel from '../pages/AdminDashboard';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import CheckoutSuccess from '../pages/CheckoutSuccess';
import CheckoutCancel from '../pages/CheckoutCancel';
import Shop from '../pages/Shop';
import Wishlist from '../pages/Wishlist';
import Profile from '../pages/Profile'; // Added import
import StarRatingTest from '../pages/StarRatingTest';
import Orders from '../pages/Orders'; // Added import for Orders page
import Navbar from '../../components/navbar';
import Footer from '../../components/footer';
import AdminRoute from './AdminRoute';
import ProtectedRoute from './protectedRoute';

const AppRoutes = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} /> {/* Added profile route */}
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} /> {/* Added orders route */}
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
          <Route path="/checkout/cancel" element={<ProtectedRoute><CheckoutCancel /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/star-rating-test" element={<StarRatingTest />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default AppRoutes;