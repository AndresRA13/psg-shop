import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import Swal from 'sweetalert2';

const CheckoutCancel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Show cancellation message
    Swal.fire({
      title: 'Pago cancelado',
      text: 'El pago ha sido cancelado. Puedes intentar nuevamente.',
      icon: 'info',
      confirmButtonText: 'Aceptar'
    }).then(() => {
      // Redirect back to checkout
      navigate('/checkout');
    });
  }, [navigate]);

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cancelando el proceso de pago...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;