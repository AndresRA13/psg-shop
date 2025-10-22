import React from 'react';

const OrderDetailsModal = ({ order, isOpen, onClose, formatDate, formatCurrency, getOrderStatusText, getStatusBadgeClass }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl mx-auto my-4 bg-white rounded-xl shadow-xl">
        <div className="p-4 sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Detalles del Pedido</h3>
              <p className="text-gray-500 text-sm sm:text-base mt-1">Pedido #{order.id.substring(0, 8)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
            >
              <svg className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-4 sm:mt-6 space-y-6 sm:space-y-8">
            {/* Order Info */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Información del Pedido</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="border-l-4 border-indigo-500 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm text-gray-500">Fecha de Pedido</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(order.createdAt)}</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm text-gray-500">Estado</p>
                  <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus || 'pending')}`}>
                    {getOrderStatusText(order.orderStatus || 'pending')}
                  </span>
                </div>
                <div className="border-l-4 border-pink-500 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm text-gray-500">Método de Pago</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{order.paymentMethod || 'N/A'}</p>
                </div>
                <div className="border-l-4 border-teal-500 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm text-gray-500">Estado de Pago</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base capitalize">{order.paymentStatus || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Customer Info */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Información del Cliente</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="border-l-4 border-indigo-500 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm text-gray-500">Correo Electrónico</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{order.userEmail || 'N/A'}</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-3 sm:pl-4">
                  <p className="text-xs sm:text-sm text-gray-500">ID de Usuario</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{order.userId?.substring(0, 8) || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            {order.address && (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Dirección de Envío</h4>
                <div className="border-l-4 border-indigo-500 pl-3 sm:pl-4">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">{order.address.name}</div>
                  <div className="text-gray-600 text-xs sm:text-sm mt-1">{order.address.street}</div>
                  <div className="text-gray-600 text-xs sm:text-sm">{order.address.city}, {order.address.state} {order.address.zipCode}</div>
                  <div className="text-gray-600 text-xs sm:text-sm">{order.address.country}</div>
                </div>
              </div>
            )}
            
            {/* Coupon Info */}
            {order.coupon && (
              <div className="bg-green-50 rounded-xl p-4 sm:p-6 border border-green-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Cupón de Descuento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
                    <p className="text-xs sm:text-sm text-gray-600">Código</p>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{order.coupon.code}</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3 sm:pl-4">
                    <p className="text-xs sm:text-sm text-gray-600">Descuento</p>
                    <p className="font-medium text-green-700 text-sm sm:text-base">
                      {order.coupon.discountType === 'percentage' 
                        ? `${order.coupon.discountValue}%` 
                        : formatCurrency(order.coupon.discountValue)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Order Items */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Productos</h4>
              <div className="space-y-3 sm:space-y-4">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center p-3 sm:p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden border border-gray-200">
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
                    <div className="ml-3 sm:ml-4 flex-1">
                      <div className="flex justify-between flex-wrap">
                        <h5 className="font-medium text-gray-900 text-sm sm:text-base">{item.name}</h5>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base mt-1 sm:mt-0">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <p className="text-gray-500 text-xs sm:text-sm">{item.category}</p>
                      <div className="flex justify-between mt-1 flex-wrap">
                        <p className="text-gray-500 text-xs sm:text-sm">Cantidad: {item.quantity}</p>
                        <p className="text-gray-500 text-xs sm:text-sm">Precio unitario: {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Resumen del Pedido</h4>
              <div className="space-y-2 sm:space-y-3 max-w-xs sm:max-w-md ml-auto">
                <div className="flex justify-between">
                  <p className="text-gray-600 text-sm sm:text-base">Subtotal</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">{formatCurrency(order.subtotal || 0)}</p>
                </div>
                {order.coupon && (
                  <div className="flex justify-between">
                    <p className="text-gray-600 text-sm sm:text-base">Descuento ({order.coupon.code})</p>
                    <p className="font-medium text-green-700 text-sm sm:text-base">-{formatCurrency(order.discount || 0)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-gray-600 text-sm sm:text-base">Envío</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">$0</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <p className="text-lg font-semibold text-gray-900">Total</p>
                  <p className="text-lg font-semibold text-indigo-700">{formatCurrency(order.totalAmount || 0)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 sm:pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 sm:px-5 sm:py-2.5 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 transition-all duration-300"
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