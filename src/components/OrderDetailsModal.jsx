import React, { useEffect, useRef } from 'react';

const OrderDetailsModal = ({ order, isOpen, onClose, formatDate, formatCurrency, getOrderStatusText, getStatusBadgeClass }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Scroll to top when modal opens
      modalRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl mx-auto my-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Detalles del Pedido</h3>
              <p className="text-gray-500 text-xs mt-1">Pedido #{order.id.substring(0, 8)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 space-y-4">
            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Información del Pedido</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Fecha</p>
                  <p className="font-medium text-gray-900 text-sm">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus || 'pending')}`}>
                    {getOrderStatusText(order.orderStatus || 'pending')}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pago</p>
                  <p className="font-medium text-gray-900 text-sm">{order.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado Pago</p>
                  <p className="font-medium text-gray-900 text-sm capitalize">{order.paymentStatus || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Cliente</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Correo</p>
                  <p className="font-medium text-gray-900 text-sm truncate">{order.userEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ID Usuario</p>
                  <p className="font-medium text-gray-900 text-sm">{order.userId?.substring(0, 8) || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            {order.address && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Dirección de Envío</h4>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{order.address.name}</div>
                  <div className="text-gray-600 mt-1">{order.address.street}</div>
                  <div className="text-gray-600">{order.address.city}, {order.address.state} {order.address.zipCode}</div>
                  <div className="text-gray-600">{order.address.country}</div>
                </div>
              </div>
            )}
            
            {/* Coupon Info */}
            {order.coupon && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Cupón</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Código</p>
                    <p className="font-medium text-gray-900 text-sm">{order.coupon.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Descuento</p>
                    <p className="font-medium text-green-700 text-sm">
                      {order.coupon.discountType === 'percentage' 
                        ? `${order.coupon.discountValue}%` 
                        : formatCurrency(order.coupon.discountValue)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Order Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Productos</h4>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center p-3 bg-white rounded border border-gray-200">
                    <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden border border-gray-200">
                      <img
                        src={item.imageUrl || 'https://via.placeholder.com/48x48.png?text=Moño'}
                        alt={item.name}
                        className="w-full h-full object-center object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/48x48.png?text=Moño';
                        }}
                      />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex justify-between flex-wrap">
                        <h5 className="font-medium text-gray-900 text-sm truncate">{item.name}</h5>
                        <p className="font-semibold text-gray-900 text-sm flex-shrink-0 ml-2">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex justify-between mt-1 flex-wrap">
                        <p className="text-gray-500 text-xs">Cant: {item.quantity}</p>
                        <p className="text-gray-500 text-xs">Unit: {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Resumen</h4>
              <div className="space-y-2 w-full">
                <div className="flex justify-between">
                  <p className="text-gray-600 text-sm">Subtotal</p>
                  <p className="font-medium text-gray-900 text-sm">{formatCurrency(order.subtotal || 0)}</p>
                </div>
                {order.coupon && (
                  <div className="flex justify-between">
                    <p className="text-gray-600 text-sm">Descuento</p>
                    <p className="font-medium text-green-700 text-sm">-{formatCurrency(order.discount || 0)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-gray-600 text-sm">Envío</p>
                  <p className="font-medium text-gray-900 text-sm">$0</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <p className="text-base font-semibold text-gray-900">Total</p>
                  <p className="text-base font-semibold text-indigo-700">{formatCurrency(order.totalAmount || 0)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 transition-all duration-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;