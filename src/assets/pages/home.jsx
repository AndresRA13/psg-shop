import React, { useState, useEffect } from 'react';
import { useForm, ValidationError } from '@formspree/react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import StarRating from '../../components/StarRating';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  const { addToWishlist } = useWishlist();
  const { currentUser } = useAuth();

  // State for testimonials slider
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Formspree form setup
  const [state, handleSubmit] = useForm("mpwybkly");
  
  // State for contact form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        const productList = await getProducts();
        // Get top 8 products with highest ratings or randomly select if no ratings
        const sortedProducts = [...productList]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 8);
        setFeaturedProducts(sortedProducts);
      } catch (err) {
        setError('Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "María González",
      text: "Los moños son de excelente calidad y el envío fue rápido. ¡Definitivamente volveré a comprar!",
      rating: 5
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      text: "Excelente atención al cliente y productos de alta calidad. Muy recomendado para eventos especiales.",
      rating: 5
    },
    {
      id: 3,
      name: "Ana Martínez",
      text: "Compré varios moños para una boda y todos quedaron hermosos. La calidad superó mis expectativas.",
      rating: 5
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get the primary image URL for a product
  const getPrimaryImageUrl = (product) => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      // Filter out empty images
      const validImages = product.imageUrls.filter(image => 
        image && (typeof image === 'string' || (image.data && typeof image.data === 'string'))
      );
      if (validImages.length > 0) {
        const primaryIndex = product.primaryImageIndex || 0;
        // Ensure primaryIndex is within bounds
        const safeIndex = Math.min(primaryIndex, validImages.length - 1);
        const primaryImage = validImages[safeIndex];
        
        // Handle both string URLs and base64 data objects
        if (typeof primaryImage === 'string') {
          return primaryImage;
        } else if (primaryImage && primaryImage.data) {
          return primaryImage.data;
        }
      }
    }
    return product.imageUrl || 'https://via.placeholder.com/300x300.png?text=Moño';
  };

  // Function to handle adding to cart with authentication check
  const handleAddToCart = (product) => {
    // Check if user is logged in
    if (!currentUser) {
      Swal.fire({
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para agregar productos al carrito',
        icon: 'warning',
        confirmButtonText: 'Iniciar sesión',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirect to login page with hash routing
          window.location.href = '/psg-shop/#/login';
        }
      });
      return;
    }

    // Check if product has stock
    const stockLimit = product.stock !== undefined ? product.stock : Infinity;
    if (stockLimit === 0) {
      Swal.fire({
        title: 'Producto agotado',
        text: 'Este producto no está disponible actualmente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    // Get the primary product image as selected in the admin panel
    const mainImage = getPrimaryImageUrl(product);
    
    addToCart({
      ...product,
      imageUrl: mainImage, // Ensure we use the primary image selected in admin panel
      quantity: 1
    });
    
    Swal.fire({
      title: 'Producto agregado',
      text: 'Producto agregado correctamente al carrito',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  };

  // Function to handle adding to wishlist with authentication check
  const handleAddToWishlist = (product) => {
    // Check if user is logged in
    if (!currentUser) {
      Swal.fire({
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para agregar productos a tu lista de deseos',
        icon: 'warning',
        confirmButtonText: 'Iniciar sesión',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Redirect to login page with hash routing
          window.location.href = '/psg-shop/#/login';
        }
      });
      return;
    }

    // Get the primary product image as selected in the admin panel
    const mainImage = getPrimaryImageUrl(product);
    
    addToWishlist({
      ...product,
      imageUrl: mainImage // Ensure we use the primary image selected in admin panel
    });
    
    Swal.fire({
      title: 'Producto agregado',
      text: 'Producto agregado correctamente a tu lista de deseos',
      icon: 'success',
      confirmButtonText: 'Aceptar'
    });
  };

  // Features data
  const features = [
    {
      id: 1,
      title: "Envío Gratis",
      description: "En pedidos superiores a $100.000 COP",
      icon: (
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      )
    },
    {
      id: 2,
      title: "Devolución Gratuita",
      description: "30 días para devoluciones sin complicaciones",
      icon: (
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      )
    },
    {
      id: 3,
      title: "Soporte 24/7",
      description: "Asistencia dedicada en cualquier momento",
      icon: (
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
        </svg>
      )
    },
    {
      id: 4,
      title: "Pago Seguro",
      description: "Protegemos tus datos de pago",
      icon: (
        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 01-8 0v4h8z"></path>
        </svg>
      )
    }
  ];

  // Categories data
  const categories = [
    { id: 1, name: "Moños Clásicos", image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "Moños Modernos", image: "https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" },
    { id: 3, name: "Moños Infantiles", image: "https://images.unsplash.com/photo-1595173425119-1c5134b706b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" },
    { id: 4, name: "Moños para Damas", image: "https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Enhanced with gradient and better typography */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="px-4 mx-auto mt-10 max-w-7xl sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                  <span className="block">Elegancia en cada</span>
                  <span className="block text-indigo-200">detalle perfecto</span>
                </h1>
                <p className="mt-3 text-base text-indigo-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Colección exclusiva de moños artesanales para todas las ocasiones. Calidad premium, diseño único y entrega rápida.
                </p>
                <div className="flex flex-col gap-4 mt-8 sm:mt-10 sm:flex-row sm:justify-center lg:justify-start">
                  <Link
                    to="/shop"
                    className="px-8 py-4 text-base font-medium text-center text-indigo-700 transition-all duration-300 bg-white border border-transparent rounded-lg shadow-md hover:bg-indigo-50 md:py-4 md:text-lg md:px-10 hover:shadow-lg"
                  >
                    Comprar Ahora
                  </Link>
                  <Link
                    to="/shop"
                    className="px-8 py-4 text-base font-medium text-center text-white transition-all duration-300 bg-transparent border-2 border-white rounded-lg hover:bg-white hover:bg-opacity-10 md:py-4 md:text-lg md:px-10"
                  >
                    Ver Catálogo
                  </Link>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="w-full h-56 sm:h-72 md:h-96 lg:w-full lg:h-full">
            <img
              className="object-cover w-full h-full"
              src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
              alt="Elegante colección de moños"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/1200x600.png?text=Elegante+Colecci%C3%B3n+de+Mo%C3%B1os';
              }}
            />
          </div>
        </div>
      </div>

      {/* Stats Section - Added to match blog style */}
      <div className="py-12 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">500+</div>
              <div className="mt-2 text-gray-600">Clientes Satisfechos</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">100+</div>
              <div className="mt-2 text-gray-600">Diseños Únicos</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">24/7</div>
              <div className="mt-2 text-gray-600">Soporte</div>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-indigo-700">5.0</div>
              <div className="mt-2 text-gray-600">Calificación Promedio</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Enhanced with better spacing and design */}
      <div className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 lg:text-center">
            <h2 className="text-base font-semibold tracking-wide text-indigo-600 uppercase">Nuestros Beneficios</h2>
            <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              Por qué elegirnos
            </p>
            <p className="max-w-2xl mt-4 text-xl text-gray-500 lg:mx-auto">
              Comprometidos con la calidad y la satisfacción del cliente
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.id} className="text-center group">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto transition-all duration-300 rounded-full bg-indigo-50 group-hover:bg-indigo-100">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-500">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section - Enhanced with gradient overlays and better design */}
      <div className="py-16 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 lg:text-center">
            <h2 className="text-base font-semibold tracking-wide text-indigo-600 uppercase">Categorías</h2>
            <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              Nuestra colección
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 mt-10 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <div key={category.id} className="relative overflow-hidden transition-all duration-300 transform shadow-lg group rounded-2xl hover:shadow-xl hover:-translate-y-1">
                <div className="relative w-full h-80">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/500x500.png?text=' + encodeURIComponent(category.name);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70"></div>
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="mb-2 text-xl font-bold text-white">{category.name}</h3>
                  <Link 
                    to="/shop" 
                    className="inline-flex items-center font-medium text-indigo-200 transition-colors duration-300 hover:text-white"
                  >
                    Explorar
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products Section - Enhanced with better card design */}
      <div className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 lg:text-center">
            <h2 className="text-base font-semibold tracking-wide text-indigo-600 uppercase">Productos Destacados</h2>
            <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              Lo más vendido
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 mt-10 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-2">
                  <div className="relative">
                    <Link to={`/product/${product.id}`}>
                      <div className="w-full overflow-hidden aspect-w-1 aspect-h-1">
                        <img
                          src={getPrimaryImageUrl(product)}
                          alt={product.name}
                          className="object-cover w-full h-64"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/300x300.png?text=Moño';
                          }}
                        />
                      </div>
                    </Link>
                    {product.stock !== undefined && product.stock <= 5 && (
                      <div className="absolute z-20 top-4 right-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.stock > 0 
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-sm' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm'
                        }`}>
                          {product.stock > 0 ? `Solo ${product.stock} disponibles` : 'Agotado'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                        {product.category}
                      </span>
                    </div>
                    
                    <h3 className="mt-2 text-lg font-medium text-gray-900 transition-colors duration-300 group-hover:text-indigo-700">
                      <Link to={`/product/${product.id}`} className="block">
                        {product.name}
                      </Link>
                    </h3>
                    
                    {product.rating > 0 && (
                      <div className="mt-2">
                        <StarRating rating={product.rating} size="sm" />
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <span className="text-lg font-semibold text-indigo-700">${parseFloat(product.price).toLocaleString('es-CO')}</span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button 
                        className="flex-1 px-4 py-2 text-sm font-medium text-white transition-all duration-300 border border-transparent rounded-md shadow-sm bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                      >
                        Agregar al Carrito
                      </button>
                      <button 
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-300 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToWishlist(product);
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-500 transition-colors duration-300 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center px-8 py-4 text-base font-medium text-white transition-all duration-300 border border-transparent rounded-lg shadow-lg bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 hover:shadow-xl"
            >
              Ver todos los productos
            </Link>
          </div>
        </div>
      </div>

      {/* Testimonials Section - Simplified slider design */}
      <div className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 lg:text-center">
            <h2 className="text-base font-semibold tracking-wide text-indigo-600 uppercase">Testimonios</h2>
            <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              Lo que dicen nuestros clientes
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-10">
            <div className="relative p-8 shadow-sm bg-gray-50 rounded-2xl">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-xl italic text-gray-600">
                  "{testimonials[currentTestimonial].text}"
                </blockquote>
                <figcaption className="mt-6">
                  <div className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</div>
                </figcaption>
              </div>
            </div>

            {/* Slider controls */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentTestimonial ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Ver testimonio ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Blog Preview Section - Replaces newsletter for logged-in users */}
      <div className="py-16 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 lg:text-center">
            <h2 className="text-base font-semibold tracking-wide text-indigo-600 uppercase">Últimas Entradas</h2>
            <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              Descubre consejos y tendencias
            </p>
            <p className="max-w-2xl mt-4 text-xl text-gray-500 lg:mx-auto">
              Explora nuestros artículos sobre estilo, cuidado y novedades en el mundo de los moños
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 mt-10 sm:grid-cols-2 lg:grid-cols-3">
            <div className="overflow-hidden transition-all duration-300 bg-white shadow-md rounded-2xl hover:shadow-xl">
              <div className="h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Cómo elegir el moño perfecto" 
                  className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-800 bg-indigo-100 rounded-full">
                    Guía de Estilo
                  </span>
                  <span className="text-sm text-gray-500">15 Oct 2025</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Cómo elegir el moño perfecto para tu ocasión especial</h3>
                <p className="mb-4 text-gray-600">Descubre los factores clave para seleccionar el moño ideal que complemente tu estilo y la ocasión.</p>
                <Link 
                  to="/blog" 
                  className="inline-flex items-center font-medium text-indigo-600 transition-colors duration-300 hover:text-indigo-800"
                >
                  Leer más
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>

            <div className="overflow-hidden transition-all duration-300 bg-white shadow-md rounded-2xl hover:shadow-xl">
              <div className="h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1611849785508-1f152a6489d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Tendencias de moda en moños" 
                  className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-800 bg-indigo-100 rounded-full">
                    Tendencias
                  </span>
                  <span className="text-sm text-gray-500">10 Oct 2025</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Tendencias de moda en moños para esta temporada</h3>
                <p className="mb-4 text-gray-600">Explora las últimas tendencias en moños y cómo incorporarlas a tu guardarropa diario.</p>
                <Link 
                  to="/blog" 
                  className="inline-flex items-center font-medium text-indigo-600 transition-colors duration-300 hover:text-indigo-800"
                >
                  Leer más
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>

            <div className="overflow-hidden transition-all duration-300 bg-white shadow-md rounded-2xl hover:shadow-xl">
              <div className="h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1595173425119-1c5134b706b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Cuidado y mantenimiento" 
                  className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-800 bg-indigo-100 rounded-full">
                    Cuidado
                  </span>
                  <span className="text-sm text-gray-500">5 Oct 2025</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">Cuidado y mantenimiento de tus moños favoritos</h3>
                <p className="mb-4 text-gray-600">Consejos profesionales para mantener tus moños en perfecto estado durante más tiempo.</p>
                <Link 
                  to="/blog" 
                  className="inline-flex items-center font-medium text-indigo-600 transition-colors duration-300 hover:text-indigo-800"
                >
                  Leer más
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 text-base font-medium text-white transition-all duration-300 border border-transparent rounded-lg shadow-md bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
            >
              Ver todos los artículos
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Section - Added below blog preview */}
      <div className="py-16 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-16 lg:text-center">
            <h2 className="text-base font-semibold tracking-wide text-indigo-600 uppercase">Contáctanos</h2>
            <p className="mt-2 text-3xl font-extrabold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              ¿Tienes preguntas?
            </p>
            <p className="max-w-2xl mt-4 text-xl text-gray-500 lg:mx-auto">
              Envíanos un mensaje y nos pondremos en contacto contigo pronto
            </p>
          </div>

          <div className="max-w-4xl mx-auto mt-10">
            <div className="p-8 shadow-sm bg-gray-50 rounded-2xl">
              {state.succeeded ? (
                <div className="p-4 mb-8 rounded-md bg-green-50">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        ¡Gracias por tu mensaje!
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>
                          Hemos recibido tu mensaje y nos pondremos en contacto contigo pronto.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700">
                        Nombre
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="tu@email.com"
                      />
                      <ValidationError 
                        prefix="Email" 
                        field="email"
                        errors={state.errors}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block mb-2 text-sm font-medium text-gray-700">
                      Asunto
                    </label>
                    <input
                      type="text"
                      name="subject"
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="¿Sobre qué te gustaría hablar?"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-700">
                      Mensaje
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 transition-colors duration-300 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Escribe tu mensaje aquí..."
                    />
                    <ValidationError 
                      prefix="Message" 
                      field="message"
                      errors={state.errors}
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={state.submitting}
                      className={`w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
                        state.submitting ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                    >
                      {state.submitting ? (
                        <>
                          <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        'Enviar Mensaje'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;