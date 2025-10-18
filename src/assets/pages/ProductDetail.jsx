import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// Removed duplicate Navbar import since it's already rendered in App.jsx
import { getProductById } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating';
import Swal from 'sweetalert2';
import { createReview, getReviewsByProductId } from '../../services/reviewService';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { addToWishlist } = useWishlist();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
        // Reset selected image index when product changes
        setSelectedImageIndex(0);
      } catch (err) {
        setError('Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Fetch reviews when product loads
  useEffect(() => {
    const fetchReviews = async () => {
      if (id) {
        try {
          setReviewLoading(true);
          const reviewsData = await getReviewsByProductId(id);
          setReviews(reviewsData);
        } catch (err) {
          console.error('Error fetching reviews:', err);
        } finally {
          setReviewLoading(false);
        }
      }
    };

    fetchReviews();
  }, [id]);

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
    return product.imageUrl || 'https://via.placeholder.com/600x600.png?text=Moño';
  };

  const handleAddToCart = () => {
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
          // Redirect to login page
          navigate('/login');
        }
      });
      return;
    }

    if (product) {
      // Check if requested quantity exceeds stock
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
      }).then(() => {
        // Optionally redirect to cart after successful addition
        // navigate('/cart');
      });
    }
  };

  // Added wishlist handler with authentication check
  const handleAddToWishlist = () => {
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
          // Redirect to login page
          navigate('/login');
        }
      });
      return;
    }

    if (product) {
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
    }
  };

  // Get all valid image URLs for the product
  const getProductImages = () => {
    if (product?.imageUrls && Array.isArray(product.imageUrls)) {
      // Filter out empty or invalid images
      const validImages = product.imageUrls.filter(image => 
        image && (typeof image === 'string' || (image.data && typeof image.data === 'string'))
      );
      
      if (validImages.length > 0) {
        // Extract URLs from either string URLs or base64 data objects
        const imageUrls = validImages.map(image => {
          if (typeof image === 'string') {
            return image;
          } else if (image && image.data) {
            return image.data;
          }
          return 'https://via.placeholder.com/600x600.png?text=Moño';
        });
        return imageUrls;
      }
      
      return ['https://via.placeholder.com/600x600.png?text=Moño'];
    }
    // Fallback to single imageUrl if imageUrls array doesn't exist
    if (product?.imageUrl) {
      return [product.imageUrl];
    }
    return ['https://via.placeholder.com/600x600.png?text=Moño'];
  };

  // Get the currently selected image URL
  const getSelectedImageUrl = () => {
    const images = getProductImages();
    return images[selectedImageIndex] || images[0];
  };

  // Handle review form changes
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle star rating click
  const handleRatingClick = (rating) => {
    setReviewForm(prev => ({
      ...prev,
      rating
    }));
  };

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser) {
      Swal.fire({
        title: 'Inicia sesión',
        text: 'Debes iniciar sesión para dejar una reseña',
        icon: 'warning',
        confirmButtonText: 'Iniciar sesión',
        showCancelButton: true,
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login');
        }
      });
      return;
    }

    // Validate review
    if (reviewForm.rating === 0) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor selecciona una calificación',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (reviewForm.comment.trim() === '') {
      Swal.fire({
        title: 'Error',
        text: 'Por favor escribe un comentario',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    setSubmittingReview(true);

    try {
      const reviewData = {
        productId: id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      };

      await createReview(reviewData);
      
      // Reset form
      setReviewForm({
        rating: 0,
        comment: ''
      });
      
      // Refresh reviews
      const reviewsData = await getReviewsByProductId(id);
      setReviews(reviewsData);
      
      Swal.fire({
        title: 'Reseña enviada',
        text: 'Tu reseña ha sido enviada correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al enviar tu reseña. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date instanceof Date) {
      return date.toLocaleDateString('es-CO');
    }
    if (date.toDate) {
      return date.toDate().toLocaleDateString('es-CO');
    }
    return 'N/A';
  };

  if (loading) {
    return (
      // Removed duplicate Navbar since it's already rendered in App.jsx
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-b-2 border-gray-900 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      // Removed duplicate Navbar since it's already rendered in App.jsx
      <div>
        <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
            <strong className="font-bold">Error! </strong>
            <span className="block sm:inline">{error || 'Product not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  const images = getProductImages();

  return (
    // Removed duplicate Navbar since it's already rendered in App.jsx
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/home" className="text-gray-500 hover:text-indigo-600 transition-colors duration-200">Home</Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <Link to="/shop" className="text-gray-500 hover:text-indigo-600 transition-colors duration-200">Shop</Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            {/* Image selector */}
            {images.length > 1 && (
              <div className="w-full max-w-2xl mx-auto mt-6 lg:max-w-none">
                <div className="grid grid-cols-4 gap-4" aria-orientation="horizontal">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      className={`relative h-20 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-200 focus:outline-none transition-all duration-200 ${
                        selectedImageIndex === index ? 'ring-2 ring-indigo-500' : 'border border-gray-200'
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <span className="sr-only">Imagen {index + 1}</span>
                      <span className="absolute inset-0 overflow-hidden rounded-md">
                        <img
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100x100.png?text=Moño';
                          }}
                        />
                      </span>
                      {selectedImageIndex === index && (
                        <span className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-2 ring-indigo-500" aria-hidden="true"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main image */}
            <div className="w-full aspect-w-1 aspect-h-1">
              <img
                src={getSelectedImageUrl()}
                alt={product.name}
                className="object-contain object-center w-full h-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x600.png?text=Moño';
                }}
              />
            </div>
          </div>

          {/* Product info */}
          <div className="px-4 mt-10 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>

            <div className="mt-4 flex items-center">
              {product.rating > 0 && (
                <div className="flex items-center">
                  <StarRating rating={product.rating} size="lg" />
                  <span className="ml-2 text-sm text-gray-600">({product.rating})</span>
                </div>
              )}
              <span className="ml-4 text-sm text-gray-500">SKU: {product.id?.substring(0, 8)}</span>
            </div>

            <div className="mt-6">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl font-bold text-indigo-700">${parseFloat(product.price).toLocaleString('es-CO')}</p>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="prose prose-indigo text-gray-700">
                <p className="text-base leading-relaxed">{product.description}</p>
              </div>
            </div>

            <div className="mt-8 border-t border-b border-gray-200 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-gray-600 font-medium">Categoría:</span>
                  <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800">
                    {product.category}
                  </span>
                </div>
                
                {product.stock !== undefined && (
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Disponibilidad:</span>
                    <span className={`ml-2 font-medium ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
                    </span>
                  </div>
                )}
                
                {product.material && (
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Material:</span>
                    <span className="ml-2 text-gray-900">{product.material}</span>
                  </div>
                )}
                
                {product.color && (
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Color:</span>
                    <span className="ml-2 text-gray-900">{product.color}</span>
                  </div>
                )}
                
                {product.size && (
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Tamaño:</span>
                    <span className="ml-2 text-gray-900">{product.size}</span>
                  </div>
                )}
                
                {product.style && (
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Estilo:</span>
                    <span className="ml-2 text-gray-900">{product.style}</span>
                  </div>
                )}
              </div>
            </div>

            <form className="mt-8">
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 min-w-[200px] px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                </button>

                <button
                  type="button"
                  onClick={handleAddToWishlist}
                  className="flex items-center justify-center px-5 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                >
                  <svg className="flex-shrink-0 w-5 h-5 text-gray-500 hover:text-red-500 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="sr-only">Agregar a favoritos</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20">
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Reseñas de Clientes</h2>
            
            {/* Review Form */}
            {currentUser && (
              <div className="mb-12 bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deja tu reseña</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingClick(star)}
                          className="text-2xl focus:outline-none transition-colors duration-200"
                        >
                          {star <= reviewForm.rating ? (
                            <span className="text-yellow-400">★</span>
                          ) : (
                            <span className="text-gray-300">☆</span>
                          )}
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        {reviewForm.rating > 0 ? `${reviewForm.rating} de 5 estrellas` : 'Selecciona una calificación'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Comentario
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={4}
                      value={reviewForm.comment}
                      onChange={handleReviewChange}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-lg p-3 transition-colors duration-200"
                      placeholder="Comparte tu experiencia con este producto..."
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className={`inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 ${
                        submittingReview 
                          ? 'bg-indigo-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {submittingReview ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : 'Enviar Reseña'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Reviews List */}
            <div>
              {reviewLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm p-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No hay reseñas aún</h3>
                  <p className="mt-1 text-gray-500">
                    Sé el primero en dejar una reseña para este producto.
                  </p>
                  {!currentUser && (
                    <div className="mt-6">
                      <Link 
                        to="/login" 
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
                      >
                        Inicia sesión para dejar una reseña
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{review.userName}</h4>
                          <div className="mt-1 flex items-center">
                            <StarRating rating={review.rating} size="sm" />
                            <span className="ml-2 text-sm text-gray-500">{review.rating}/5</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;