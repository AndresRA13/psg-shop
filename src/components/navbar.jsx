import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaShoppingCart, FaHeart, FaBars, FaTimes, FaYoutube, FaLinkedin, FaFacebook, FaTwitter, FaUser, FaCog, FaSignOutAlt, FaList } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

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
      <header className="sticky top-0 z-50 font-sans bg-white shadow-sm">
        <nav className="flex items-center justify-between p-4 mx-auto max-w-7xl">
          {/* Logo */}
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
            <Link to="/home">CARTSHOP</Link>
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
                Blog
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
            <div className={`hidden md:block ${iconClasses} text-xl`}>
              <FaSearch />
            </div>
            
            {/* Wishlist Icon */}
            <Link to="/wishlist" className={`${iconClasses} text-xl flex items-center justify-center relative`}>
              <FaHeart />
              {wishlistItemCount > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 -top-2 -right-3">
                  {wishlistItemCount}
                </span>
              )}
            </Link>
            
            {/* Cart Icon */}
            <Link to="/cart" className={`${iconClasses} text-xl flex items-center justify-center relative`}>
              <FaShoppingCart />
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
                  <FaUser className="text-gray-600" />
                </Link>
              )}
              
              {/* User Dropdown Menu */}
              {currentUser && isProfileMenuOpen && (
                <div className="absolute right-0 z-50 w-64 mt-2 bg-gray-800 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-700">
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
                        <p className="text-sm font-bold text-white">
                          {userProfile?.displayName || currentUser.email?.split('@')[0] || 'Usuario'}
                        </p>
                        <p className="text-xs text-gray-400">{currentUser.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-1">
                    {console.log('Rendering admin link, isAdmin:', isAdmin)}
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600"
                        onClick={closeProfileMenu}
                      >
                        <FaCog className="mr-3 text-gray-400" />
                        <span>Administrar página</span>
                      </Link>
                    )}
                    
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600"
                      onClick={closeProfileMenu}
                    >
                      <FaUser className="mr-3 text-gray-400" />
                      <span>Editar perfil</span>
                    </Link>
                    
                    {/* Orders Link */}
                    <div className="border-t border-gray-700">
                      <Link 
                        to="/orders" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600"
                        onClick={closeProfileMenu}
                      >
                        <FaList className="mr-3 text-gray-400" />
                        <span>Mis Pedidos</span>
                      </Link>
                    </div>
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-left text-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-600"
                    >
                      <FaSignOutAlt className="mr-3 text-gray-400" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Mobile Menu Button */}
            <div className="ml-3 text-2xl cursor-pointer md:hidden text-slate-800" onClick={toggleMenu}>
              <FaBars />
              {/* Menu badge (example with 11 items) */}
              <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-semibold text-white rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 -top-1 -right-1">
                11
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu (Off-canvas) */}
      <>
        {isMenuOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={toggleMenu}></div>}
        <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 p-5 flex flex-col font-sans`}>
          <div className="flex items-center justify-between mb-10">
            <div className="text-xl font-bold text-slate-800">BOWSHOP</div>
            <button onClick={toggleMenu} className="text-2xl cursor-pointer text-slate-600 hover:text-slate-900">
              <FaTimes />
            </button>
          </div>
          <ul className="flex-grow space-y-4">
            <li>
              <Link 
                to="/home" 
                className={`text-lg ${isActiveLink('/home') ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium' : navLinkClasses}`} 
                onClick={toggleMenu}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link 
                to="/shop" 
                className={`text-lg ${isActiveLink('/shop') ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium' : navLinkClasses}`} 
                onClick={toggleMenu}
              >
                Productos
              </Link>
            </li>
            <li>
              <Link 
                to="/blog" 
                className={`text-lg ${isActiveLink('/blog') ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium' : navLinkClasses}`} 
                onClick={toggleMenu}
              >
                Blog
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                className={`text-lg ${isActiveLink('/contact') ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium' : navLinkClasses}`} 
                onClick={toggleMenu}
              >
                Contacto
              </Link>
            </li>
            <li>
              <Link 
                to="/cart" 
                className={`text-lg ${isActiveLink('/cart') ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium' : navLinkClasses}`} 
                onClick={toggleMenu}
              >
                Carrito
              </Link>
            </li>
            <li>
              <Link 
                to="/wishlist" 
                className={`text-lg ${isActiveLink('/wishlist') ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium' : navLinkClasses}`} 
                onClick={toggleMenu}
              >
                Favoritos
              </Link>
            </li>
            {/* Admin Panel button in mobile menu - only visible to admin users */}
            {currentUser && isAdmin && (
              <li>
                <Link 
                  to="/admin" 
                  className={`text-lg ${isActiveLink('/admin') ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 font-medium' : 'text-blue-600'}`} 
                  onClick={toggleMenu}
                >
                  Panel administrativo 
                </Link>
              </li>
            )}
          </ul>
          <div className="mt-4">
            {currentUser ? (
              <button 
                onClick={() => { handleLogout(); toggleMenu(); }}
                className="w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cerrar Sesión
              </button>
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
          <div className="flex justify-center p-5 mt-auto space-x-6">
            <a href="#" className="text-2xl transition-colors duration-300 text-slate-600 hover:text-indigo-600">
              <FaYoutube />
            </a>
            <a href="#" className="text-2xl transition-colors duration-300 text-slate-600 hover:text-indigo-600">
              <FaLinkedin />
            </a>
            <a href="#" className="text-2xl transition-colors duration-300 text-slate-600 hover:text-indigo-600">
              <FaFacebook />
            </a>
            <a href="#" className="text-2xl transition-colors duration-300 text-slate-600 hover:text-indigo-600">
              <FaTwitter />
            </a>
          </div>
        </aside>
      </>
    </>
  );
};

export default Navbar;