import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
// Removed duplicate Navbar import since it's already rendered in App.jsx
import { getProductById } from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../App';
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
      
      addToCart({
        ...product,
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
      addToWishlist(product);
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
    <div>
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <Link to="/home" className="text-gray-500 hover:text-gray-700">Home</Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <Link to="/shop" className="text-gray-500 hover:text-gray-700">Shop</Link>
            </li>
            <li>
              <span className="text-gray-500">/</span>
            </li>
            <li>
              <span className="text-gray-900">{product.name}</span>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            {/* Image selector */}
            {images.length > 1 && (
              <div className="hidden w-full max-w-2xl mx-auto mt-6 sm:block lg:max-w-none">
                <div className="grid grid-cols-4 gap-6" aria-orientation="horizontal">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      className={`relative h-24 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-indigo-500 ${
                        selectedImageIndex === index ? 'ring-2 ring-indigo-500' : ''
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
                className="object-cover object-center w-full h-full sm:rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/600x600.png?text=Moño';
                }}
              />
            </div>
          </div>

          {/* Product info */}
          <div className="px-4 mt-10 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.name}</h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl text-gray-900">${parseFloat(product.price).toLocaleString('es-CO')}</p>
            </div>

            {product.rating > 0 && (
              <div className="mt-2">
                <StarRating rating={product.rating} size="lg" />
              </div>
            )}

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="space-y-6 text-base text-gray-700">
                <p>{product.description}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center">
                <span className="mr-2 text-gray-700">Categoría:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {product.category}
                </span>
              </div>
              
              {product.stock !== undefined && (
                <div className="flex items-center mt-2">
                  <span className="mr-2 text-gray-700">Stock:</span>
                  <span className={`font-medium ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
                  </span>
                </div>
              )}
              
              {product.material && (
                <div className="flex items-center mt-2">
                  <span className="mr-2 text-gray-700">Material:</span>
                  <span className="text-gray-900">{product.material}</span>
                </div>
              )}
              
              {product.color && (
                <div className="flex items-center mt-2">
                  <span className="mr-2 text-gray-700">Color:</span>
                  <span className="text-gray-900">{product.color}</span>
                </div>
              )}
              
              {product.size && (
                <div className="flex items-center mt-2">
                  <span className="mr-2 text-gray-700">Tamaño:</span>
                  <span className="text-gray-900">{product.size}</span>
                </div>
              )}
              
              {product.style && (
                <div className="flex items-center mt-2">
                  <span className="mr-2 text-gray-700">Estilo:</span>
                  <span className="text-gray-900">{product.style}</span>
                </div>
              )}
            </div>

            <form className="mt-6">
              <div className="flex gap-3 mt-10 sm:flex-col1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex items-center justify-center flex-1 max-w-xs px-8 py-3 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-full"
                  disabled={product.stock === 0}
                >
                  Agregar al Carrito
                </button>

                <button
                  type="button"
                  onClick={handleAddToWishlist}
                  className="flex items-center justify-center px-4 py-3 ml-4 text-gray-400 rounded-md hover:bg-gray-100 hover:text-gray-500"
                >
                  <svg className="flex-shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="sr-only">Add to favorites</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="border-t border-gray-200 pt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Reseñas de Clientes</h2>
            
            {/* Review Form */}
            {currentUser && (
              <div className="mb-10">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deja tu reseña</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingClick(star)}
                          className="text-2xl focus:outline-none"
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
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                      placeholder="Comparte tu experiencia con este producto..."
                    />
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        submittingReview 
                          ? 'bg-indigo-400 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {submittingReview ? 'Enviando...' : 'Enviar Reseña'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Reviews List */}
            <div>
              {reviewLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay reseñas para este producto aún.</p>
                  {!currentUser && (
                    <p className="mt-2 text-sm text-gray-500">
                      <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
                        Inicia sesión para dejar la primera reseña
                      </Link>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{review.userName}</h4>
                          <div className="mt-1">
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                      </div>
                      <div className="mt-4">
                        <p className="text-gray-700">{review.comment}</p>
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