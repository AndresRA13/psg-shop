import React from 'react';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/navbar';

const CouponTest = () => {
  const { applyCoupon, removeCoupon, coupon } = useCart();

  const handleApplyCoupon = async () => {
    try {
      // Try to apply a sample coupon
      const result = await applyCoupon('DESCUENTO10');
      console.log('Coupon applied successfully:', result);
      alert('Coupon applied successfully!');
    } catch (error) {
      console.error('Error applying coupon:', error);
      alert('Error applying coupon: ' + error.message);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    alert('Coupon removed!');
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Prueba de Cupones</h1>
        
        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Funcionalidad de Cupones</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Estado Actual</h3>
              {coupon ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="font-medium text-green-800">Cupón Aplicado: {coupon.code}</p>
                  <p className="text-sm text-green-600">
                    Descuento: {coupon.discountType === 'percentage' 
                      ? `${coupon.discountValue}%` 
                      : `$${coupon.discountValue}`}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">No hay cupón aplicado</p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleApplyCoupon}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Aplicar Cupón de Prueba (DESCUENTO10)
              </button>
              
              <button
                onClick={handleRemoveCoupon}
                disabled={!coupon}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  coupon 
                    ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Remover Cupón
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-md font-medium text-blue-800 mb-2">Instrucciones</h3>
              <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                <li>Primero, asegúrate de haber creado un cupón de prueba en Firestore</li>
                <li>Haz clic en "Aplicar Cupón de Prueba" para probar la funcionalidad</li>
                <li>Verifica que el cupón se aplique correctamente</li>
                <li>Haz clic en "Remover Cupón" para eliminarlo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponTest;