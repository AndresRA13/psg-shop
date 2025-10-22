import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { BsCart3 } from "react-icons/bs";
import { GoHeart } from "react-icons/go";
import { FiSearch, FiUser, FiSettings, FiList, FiLogOut, FiMenu, FiX, FiYoutube, FiLinkedin, FiFacebook, FiTwitter, FiHome, FiPackage, FiBook, FiMail } from "react-icons/fi";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { currentUser, isAdmin, userProfile } = useAuth();
  const { items } = useCart();
  const { items: wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);

  // Debug log to see if isAdmin is updating
  useEffect(() => {
    console.log('Navbar isAdmin value:', isAdmin);
  }, [isAdmin]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    console.log('Toggling profile menu, current state:', isProfileMenuOpen);
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const closeProfileMenu = () => {
    console.log('Closing profile menu');
    setIsProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      closeProfileMenu();
      navigate('/home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinkClasses = "text-slate-600 hover:text-slate-900 transition-colors duration-300";
  const iconClasses = "relative text-slate-600 hover:text-slate-900 transition-colors duration-300 cursor-pointer";

  // Calculate total items in cart and wishlist
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);
  const wishlistItemCount = wishlistItems.length;

  // Function to determine if a link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="sticky top-0 z-50 font-sans bg-white shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
        <nav className="flex items-center justify-between p-4 mx-auto max-w-7xl">
          {/* Left section with menu button and logo */}
          <div className="flex items-center">
            {/* Mobile Menu Button - Moved to the left with minimal spacing */}
            <div className="mr-0 text-2xl cursor-pointer md:hidden text-slate-800" onClick={toggleMenu}>
              <FiMenu />
              {/* Menu badge removed - was showing "11" unnecessarily */}
            </div>
            
            {/* Logo */}
            <div className="text-2xl font-bold">
              <Link to="/home">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">CART</span>
                <span className="text-slate-800">SHOP</span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation Menu */}
          <ul className="items-center hidden space-x-8 md:flex">
            <li>
              <Link 
                to="/home" 
                className={isActiveLink('/home') 
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium" 
                  : navLinkClasses}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link 
                to="/shop" 
                className={isActiveLink('/shop') 
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium" 
                  : navLinkClasses}
              >
                Productos
              </Link>
            </li>
            <li>
              <Link 
                to="/blog" 
                className={isActiveLink('/blog') 
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium" 
                  : navLinkClasses}
              >
                Sobre Nosotros
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                className={isActiveLink('/contact') 
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium" 
                  : navLinkClasses}
              >
                Contacto
              </Link>
            </li>
          </ul>

          {/* Right-aligned Icons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist Icon */}
            <Link to="/wishlist" className={`${iconClasses} text-xl flex items-center justify-center relative`}>
              <GoHeart />
              {wishlistItemCount > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 -top-2 -right-3">
                  {wishlistItemCount}
                </span>
              )}
            </Link>
            
            {/* Cart Icon */}
            <Link to="/cart" className={`${iconClasses} text-xl flex items-center justify-center relative`}>
              <BsCart3 />
              {cartItemCount > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 -top-2 -right-3">
                  {cartItemCount}
                </span>
              )}
            </Link>
            
            {/* User Profile Icon */}
            <div className="relative" ref={profileMenuRef}>
              {currentUser ? (
                // User profile image or initial
                <div className="flex items-center justify-center w-8 h-8 bg-gray-200 border border-gray-300 rounded-full cursor-pointer" onClick={toggleProfileMenu}>
                  {userProfile?.profileImage ? (
                    <img 
                      src={userProfile.profileImage} 
                      alt="Profile" 
                      className="object-cover w-full h-full rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-bold text-gray-600">
                      {userProfile?.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              ) : (
                // Default user icon for non-logged in users - redirect to login
                <Link to="/login" className="flex items-center justify-center w-8 h-8 bg-gray-200 border border-gray-300 rounded-full cursor-pointer">
                  <FiUser className="text-gray-600" />
                </Link>
              )}
              
              {/* User Dropdown Menu */}
              {currentUser && isProfileMenuOpen && (
                <div className="absolute right-0 z-50 w-64 mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-200 border border-gray-300 rounded-full">
                        {userProfile?.profileImage ? (
                          <img 
                            src={userProfile.profileImage} 
                            alt="Profile" 
                            className="object-cover w-full h-full rounded-full"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-600">
                            {userProfile?.displayName?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-bold text-gray-900">
                          {userProfile?.displayName || currentUser.email?.split('@')[0] || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-500">{currentUser.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    {console.log('Rendering admin link, isAdmin:', isAdmin)}
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeProfileMenu}
                      >
                        <FiSettings className="mr-3 text-gray-400" />
                        <span>Administrar página</span>
                      </Link>
                    )}
                    
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeProfileMenu}
                    >
                      <FiUser className="mr-3 text-gray-400" />
                      <span>Editar perfil</span>
                    </Link>
                    
                    {/* Orders Link */}
                    <div className="border-t border-gray-200">
                      <Link 
                        to="/orders" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeProfileMenu}
                      >
                        <FiList className="mr-3 text-gray-400" />
                        <span>Mis Pedidos</span>
                      </Link>
                    </div>
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 text-gray-400" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu (Off-canvas) */}
      <>
        {isMenuOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={toggleMenu}></div>}
        <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 p-5 flex flex-col font-sans`} style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="flex items-center justify-between mb-10">
            <div className="text-xl font-bold">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">CART</span>
              <span className="text-slate-800">SHOP</span>
            </div>
            <button onClick={toggleMenu} className="text-2xl cursor-pointer text-slate-600 hover:text-slate-900">
              <FiX />
            </button>
          </div>
          <ul className="flex-grow space-y-4">
            <li>
              <Link 
                to="/home" 
                className={`text-lg ${isActiveLink('/home') ? 'text-indigo-600 font-medium' : 'text-slate-800'}`} 
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <FiHome className={`mr-3 ${isActiveLink('/home') ? 'text-indigo-600' : 'text-slate-800'}`} />
                  <span>Inicio</span>
                </div>
              </Link>
            </li>
            <li>
              <Link 
                to="/shop" 
                className={`text-lg ${isActiveLink('/shop') ? 'text-indigo-600 font-medium' : 'text-slate-800'}`} 
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <FiPackage className={`mr-3 ${isActiveLink('/shop') ? 'text-indigo-600' : 'text-slate-800'}`} />
                  <span>Productos</span>
                </div>
              </Link>
            </li>
            <li>
              <Link 
                to="/blog" 
                className={`text-lg ${isActiveLink('/blog') ? 'text-indigo-600 font-medium' : 'text-slate-800'}`} 
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <FiBook className={`mr-3 ${isActiveLink('/blog') ? 'text-indigo-600' : 'text-slate-800'}`} />
                  <span>Sobre Nosotros</span>
                </div>
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                className={`text-lg ${isActiveLink('/contact') ? 'text-indigo-600 font-medium' : 'text-slate-800'}`} 
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <FiMail className={`mr-3 ${isActiveLink('/contact') ? 'text-indigo-600' : 'text-slate-800'}`} />
                  <span>Contacto</span>
                </div>
              </Link>
            </li>
            <li>
              <Link 
                to="/cart" 
                className={`text-lg ${isActiveLink('/cart') ? 'text-indigo-600 font-medium' : 'text-slate-800'}`} 
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <BsCart3 className={`mr-3 ${isActiveLink('/cart') ? 'text-indigo-600' : 'text-slate-800'}`} />
                  <span>Carrito</span>
                </div>
              </Link>
            </li>
            <li>
              <Link 
                to="/wishlist" 
                className={`text-lg ${isActiveLink('/wishlist') ? 'text-indigo-600 font-medium' : 'text-slate-800'}`} 
                onClick={toggleMenu}
              >
                <div className="flex items-center">
                  <GoHeart className={`mr-3 ${isActiveLink('/wishlist') ? 'text-indigo-600' : 'text-slate-800'}`} />
                  <span>Favoritos</span>
                </div>
              </Link>
            </li>
          </ul>
          <div className="mt-4">
            {currentUser ? (
              <>
                {/* Admin Panel button - only visible to admin users */}
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block w-full px-4 py-2 mb-2 text-sm font-medium text-center text-white border border-transparent rounded-md shadow-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={toggleMenu}
                  >
                    Panel administrativo 
                  </Link>
                )}
                
                <button 
                  onClick={() => { handleLogout(); toggleMenu(); }}
                  className="w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="block w-full px-4 py-2 text-sm font-medium text-center text-white border border-transparent rounded-md shadow-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={toggleMenu}
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </aside>
      </>
    </>
  );
};

export default Navbar;