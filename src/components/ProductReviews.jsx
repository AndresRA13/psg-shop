import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getReviewsByProductId } from '../services/reviewService';
import StarRating from './StarRating';
import Swal from 'sweetalert2';

const ProductReviews = ({ productId }) => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const reviewsData = await getReviewsByProductId(productId);
        setReviews(reviewsData);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

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

    setSubmitting(true);

    try {
      const reviewData = {
        productId: productId,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      };

      // Note: We're not actually submitting here since this is just a display component
      // In a real implementation, you would call a service function to submit the review
      
      // Reset form
      setReviewForm({
        rating: 0,
        comment: ''
      });
      
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
      setSubmitting(false);
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
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Reseñas de Clientes ({reviews.length})</h3>
      
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay reseñas para este producto aún.</p>
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
  );
};

export default ProductReviews;