import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import StarRating from '../../components/StarRating';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { addToWishlist } = useWishlist();
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productList = await getProducts();
        setProducts(productList);
      } catch (err) {
        setError('Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on category and search term
  const filteredProducts = useMemo(() => {
    let result = filter === 'all' 
      ? products 
      : products.filter(product => product.category === filter);
      
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(term) || 
        (product.description && product.description.toLowerCase().includes(term)) ||
        (product.category && product.category.toLowerCase().includes(term)) ||
        (product.material && product.material.toLowerCase().includes(term)) ||
        (product.color && product.color.toLowerCase().includes(term))
      );
    }
    
    return result;
  }, [products, filter, searchTerm]);

  // Get unique categories
  const categories = ['all', ...new Set(products.map(product => product.category))];

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

  return (
    <div>
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col mb-8 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Nuestra Colección</h1>
          <div className="flex flex-col gap-4 mt-4 md:mt-0 sm:flex-row">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label htmlFor="category-filter" className="mr-2 text-sm font-medium text-gray-700">
                Filtrar por:
              </label>
              <select
                id="category-filter"
                className="border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'Todos' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-b-2 border-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <>
            {searchTerm && (
              <div className="mb-4 text-sm text-gray-600">
                {filteredProducts.length} producto(s) encontrado(s) para "{searchTerm}"
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="overflow-hidden transition-shadow duration-300 bg-white rounded-lg shadow-md hover:shadow-lg">
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
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                      {product.stock !== undefined && product.stock <= 5 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {product.stock > 0 ? `Solo ${product.stock} disponibles` : 'Agotado'}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="mt-2 text-lg font-medium text-gray-900">{product.name}</h3>
                    
                    {product.rating > 0 && (
                      <div className="mt-2">
                        <StarRating rating={product.rating} size="sm" />
                      </div>
                    )}
                    
                    <div className="mt-2">
                      <span className="text-lg font-semibold text-indigo-600">${parseFloat(product.price).toLocaleString('es-CO')}</span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <button 
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                      >
                        Agregar al Carrito
                      </button>
                      <button 
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToWishlist(product);
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="py-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron productos</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm 
                ? `No se encontraron productos que coincidan con "${searchTerm}".` 
                : 'No hay productos disponibles en esta categoría.'}
            </p>
            {searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Ver todos los productos
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;