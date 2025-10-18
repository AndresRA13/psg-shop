import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, loading, coupon, applyCoupon, removeCoupon } = useCart();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

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

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setApplyingCoupon(true);
    setCouponError('');
    
    try {
      await applyCoupon(couponCode.trim());
      setCouponCode('');
    } catch (error) {
      setCouponError(error.message || 'Error al aplicar el cupón');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
  };

  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tu Carrito de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Tu carrito está vacío</h3>
            <p className="mt-1 text-gray-500">Empieza a agregar productos a tu carrito de compras.</p>
            <div className="mt-6">
              <Link
                to="/shop"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
              <div className="lg:col-span-8">
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="py-6 flex">
                      <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100x100.png?text=Moño';
                          }}
                        />
                      </div>

                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>
                              <Link to={`/product/${item.id}`}>{item.name}</Link>
                            </h3>
                            <p className="ml-4">${parseFloat(item.price * item.quantity).toLocaleString('es-CO')}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="mx-2 text-gray-700">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.stock !== undefined && item.quantity >= item.stock}
                              className="p-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 lg:mt-0 lg:col-span-4">
                <div className="bg-white rounded-lg px-4 py-6 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Resumen del Pedido</h2>
                  
                  {/* Coupon Section */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Cupón de Descuento</h3>
                    {coupon ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                        <div>
                          <span className="font-medium text-green-800">{coupon.code}</span>
                          <span className="ml-2 text-sm text-green-600">
                            {coupon.discountType === 'percentage' 
                              ? `-${coupon.discountValue}%` 
                              : `-$${coupon.discountValue.toLocaleString('es-CO')}`}
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Ingresa tu código"
                          className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={applyingCoupon}
                        />
                        <button
                          type="submit"
                          disabled={applyingCoupon || !couponCode.trim()}
                          className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                            applyingCoupon || !couponCode.trim()
                              ? 'bg-indigo-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800'
                          }`}
                        >
                          {applyingCoupon ? 'Aplicando...' : 'Aplicar'}
                        </button>
                      </form>
                    )}
                    {couponError && (
                      <p className="mt-2 text-sm text-red-600">{couponError}</p>
                    )}
                  </div>
                  
                  <dl className="space-y-6">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-600">Subtotal</dt>
                      <dd className="text-sm font-medium text-gray-900">${parseFloat(subtotal).toLocaleString('es-CO')}</dd>
                    </div>
                    
                    {coupon && (
                      <div className="flex items-center justify-between">
                        <dt className="text-sm text-gray-600">Descuento ({coupon.code})</dt>
                        <dd className="text-sm font-medium text-green-600">
                          -${parseFloat(subtotal - getTotalPrice()).toLocaleString('es-CO')}
                        </dd>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                      <dt className="text-base font-medium text-gray-900">Total del Pedido</dt>
                      <dd className="text-base font-medium text-gray-900">${parseFloat(getTotalPrice()).toLocaleString('es-CO')}</dd>
                    </div>
                  </dl>
                  
                  {/* Stock warning */}
                  {items.some(item => item.stock !== undefined && item.stock < item.quantity) && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">Algunos productos tienen stock limitado</h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>La cantidad en tu carrito excede el stock disponible para algunos productos. Por favor, ajusta las cantidades.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-indigo-500"
                      disabled={items.some(item => item.stock !== undefined && item.stock < item.quantity)}
                    >
                      Proceder al Pago
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <Link to="/shop" className="text-indigo-600 hover:text-indigo-500">
                      &larr; Continuar Comprando
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;