import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthContext, useAuth } from './context/AuthContext';
import Shop from './assets/pages/Shop';
import ProductDetail from './assets/pages/ProductDetail';
import Cart from './assets/pages/Cart';
import Checkout from './assets/pages/Checkout';
import Profile from './assets/pages/Profile';
import Login from './components/login';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import ModernAdminDashboard from './assets/pages/ModernAdminDashboard';
import Orders from './assets/pages/Orders';
import CouponTest from './assets/pages/CouponTest';
import Wishlist from './assets/pages/Wishlist';
import Navbar from './components/navbar';
import Footer from './components/footer';
import createSampleCoupon from './utils/createSampleCoupon';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user profile data
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserProfile(userData);
            setIsAdmin(userData.role === 'admin');
          } else {
            setUserProfile(null);
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
          setIsAdmin(false);
        }
      } else {
        setUserProfile(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    isAdmin
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Protected Route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    
    if (adminOnly && !isAdmin) {
      return <Navigate to="/home" />;
    }
    
    return children;
  };

  // Redirect authenticated users away from login/register
  const RedirectIfAuthenticated = ({ children }) => {
    if (currentUser) {
      return <Navigate to="/home" />;
    }
    return children;
  };

  const handleCreateSampleCoupon = async () => {
    try {
      const couponId = await createSampleCoupon();
      alert(`Sample coupon created successfully with ID: ${couponId}`);
    } catch (error) {
      alert(`Error creating sample coupon: ${error.message}`);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      <CartProvider>
        <WishlistProvider>
          <div className="flex flex-col min-h-screen">
            {/* Only show navbar for non-admin routes */}
            <Routes>
              <Route path="/admin/*" element={null} />
              <Route path="*" element={<Navbar />} />
            </Routes>
            
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Shop />} />
                <Route path="/home" element={<Shop />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={
                  <RedirectIfAuthenticated>
                    <Login />
                  </RedirectIfAuthenticated>
                } />
                <Route path="/register" element={
                  <RedirectIfAuthenticated>
                    <Register />
                  </RedirectIfAuthenticated>
                } />
                <Route path="/reset-password" element={
                  <RedirectIfAuthenticated>
                    <ResetPassword />
                  </RedirectIfAuthenticated>
                } />
                <Route path="/admin/*" element={
                  <ProtectedRoute adminOnly>
                    <ModernAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/coupon-test" element={
                  <ProtectedRoute adminOnly>
                    <CouponTest />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            {/* Only show footer for non-admin routes */}
            <Routes>
              <Route path="/admin/*" element={null} />
              <Route path="*" element={<Footer />} />
            </Routes>
          </div>
        </WishlistProvider>
      </CartProvider>
    </AuthContext.Provider>
  );
}

export default App;