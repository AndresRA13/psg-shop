import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar';
import Swal from 'sweetalert2';

const CheckoutSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Show success message
    Swal.fire({
      title: '¡Pago exitoso!',
      text: 'Tu pago ha sido procesado correctamente.',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Ir a mis pedidos',
      showCancelButton: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Prompt to leave reviews
        Swal.fire({
          title: '¿Te gustaría dejar una reseña?',
          text: 'Ayuda a otros clientes compartiendo tu experiencia con los productos que compraste.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Dejar reseñas',
          cancelButtonText: 'Más tarde'
        }).then((reviewResult) => {
          if (reviewResult.isConfirmed) {
            navigate('/orders');
          } else {
            navigate('/home');
          }
        });
      } else {
        navigate('/orders');
      }
    });
  }, [navigate]);

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Procesando tu pago...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;