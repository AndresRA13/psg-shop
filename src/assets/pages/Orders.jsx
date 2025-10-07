import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrdersByUserId } from '../../services/orderService';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import { createReview } from '../../services/reviewService';
import Swal from 'sweetalert2';

const Orders = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState(null);

  // Get status text in Spanish
  const getOrderStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'Procesando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeOrderDetails = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Open review form for a product
  const openReviewForm = (product) => {
    setReviewingProduct({
      productId: product.id,
      productName: product.name,
      rating: 0,
      comment: ''
    });
  };

  // Handle review form changes
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewingProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle star rating click
  const handleRatingClick = (rating) => {
    setReviewingProduct(prev => ({
      ...prev,
      rating
    }));
  };

  // Submit review
  const submitReview = async () => {
    // Validate review
    if (reviewingProduct.rating === 0) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor selecciona una calificación',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (reviewingProduct.comment.trim() === '') {
      Swal.fire({
        title: 'Error',
        text: 'Por favor escribe un comentario',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    try {
      const reviewData = {
        productId: reviewingProduct.productId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        rating: reviewingProduct.rating,
        comment: reviewingProduct.comment.trim()
      };

      await createReview(reviewData);
      
      Swal.fire({
        title: 'Reseña enviada',
        text: 'Tu reseña ha sido enviada correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      
      setReviewingProduct(null);
    } catch (error) {
      console.error('Error submitting review:', error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un error al enviar tu reseña. Por favor intenta nuevamente.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const ordersData = await getOrdersByUserId(currentUser.uid);
        setOrders(ordersData);
      } catch (err) {
        console.error('Error fetching user orders:', err);
        setError('No se pudieron cargar tus órdenes. Por favor, intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="mt-2 text-gray-600">Consulta el estado de tus pedidos recientes</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No tienes pedidos</h3>
            <p className="mt-1 text-gray-500">Aún no has realizado ningún pedido.</p>
            <div className="mt-6">
              <Link
                to="/shop"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Comprar ahora
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Pedido #{order.id.substring(0, 8)}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Realizado el {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                        {getOrderStatusText(order.orderStatus)}
                      </span>
                      <button
                        onClick={() => openOrderDetails(order)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-lg font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Productos</p>
                      <p className="text-lg font-medium text-gray-900">
                        {order.items?.length || 0} {order.items?.length === 1 ? 'producto' : 'productos'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Método de Pago</p>
                      <p className="text-lg font-medium text-gray-900">{order.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Products in order with review option */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Productos en este pedido</h4>
                    <div className="space-y-4">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-md overflow-hidden">
                              <img
                                src={item.imageUrl || 'https://via.placeholder.com/64x64.png?text=Moño'}
                                alt={item.name}
                                className="w-full h-full object-center object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/64x64.png?text=Moño';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-900">{item.name}</h5>
                              <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => openReviewForm(item)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Dejar reseña
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Review Modal */}
      {reviewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
          <div className="relative w-full max-w-md mx-auto my-8 bg-white rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Dejar una reseña</h3>
                <button
                  onClick={() => setReviewingProduct(null)}
                  className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-2">
                <h4 className="font-medium text-gray-900">{reviewingProduct.productName}</h4>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className="text-2xl focus:outline-none"
                      >
                        {star <= reviewingProduct.rating ? (
                          <span className="text-yellow-400">★</span>
                        ) : (
                          <span className="text-gray-300">☆</span>
                        )}
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-500">
                      {reviewingProduct.rating > 0 ? `${reviewingProduct.rating} de 5 estrellas` : 'Selecciona una calificación'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Comentario
                  </label>
                  <textarea
                    id="review-comment"
                    name="comment"
                    rows={4}
                    value={reviewingProduct.comment}
                    onChange={handleReviewChange}
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                    placeholder="Comparte tu experiencia con este producto..."
                  />
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setReviewingProduct(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitReview}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Enviar Reseña
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <OrderDetailsModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={closeOrderDetails}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        getOrderStatusText={getOrderStatusText}
        getStatusBadgeClass={getStatusBadgeClass}
      />
    </div>
  );
};

export default Orders;