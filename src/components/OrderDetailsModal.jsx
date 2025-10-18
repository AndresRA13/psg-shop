import React from 'react';

const OrderDetailsModal = ({ order, isOpen, onClose, formatDate, formatCurrency, getOrderStatusText, getStatusBadgeClass, theme }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
      <div className={`relative w-full max-w-2xl mx-auto my-8 rounded-lg shadow-xl ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Detalles de la Orden</h3>
            <button
              onClick={onClose}
              className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              ×
            </button>
          </div>
          
          <div className="mt-2 space-y-6">
            {/* Order Info */}
            <div>
              <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Información de la Orden</h4>
              <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>ID de Orden</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.id}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Fecha</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Estado</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      theme === 'dark' 
                        ? getStatusBadgeClass(order.orderStatus || 'pending', 'dark') 
                        : getStatusBadgeClass(order.orderStatus || 'pending', 'light')
                    }`}>
                      {getOrderStatusText(order.orderStatus || 'pending')}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Método de Pago</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.paymentMethod || 'N/A'}</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                      {order.paymentStatus === 'completed' ? 'Pagado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Customer Info */}
            <div>
              <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Información del Cliente</h4>
              <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Nombre</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.userEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>ID de Usuario</p>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.userId?.substring(0, 8) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            {order.address && (
              <div>
                <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dirección de Envío</h4>
                <div className={`rounded-lg p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.address.name}</p>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>{order.address.street}</p>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>{order.address.city}, {order.address.state} {order.address.zipCode}</p>
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>{order.address.country}</p>
                </div>
              </div>
            )}
            
            {/* Coupon Info */}
            {order.coupon && (
              <div>
                <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Cupón de Descuento</h4>
                <div className={`rounded-lg p-4 border ${
                  theme === 'dark' ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-gray-500'}`}>Código</p>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.coupon.code}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-gray-500'}`}>Descuento</p>
                      <p className={`font-medium ${
                        theme === 'dark' ? 'text-green-200' : 'text-green-600'
                      }`}>
                        {order.coupon.discountType === 'percentage' 
                          ? `${order.coupon.discountValue}%` 
                          : formatCurrency(order.coupon.discountValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Order Items */}
            <div>
              <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Productos</h4>
              <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-700 divide-gray-600' : 'bg-gray-50 divide-gray-200'} divide-y`}>
                {order.items?.map((item, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden ${
                        theme === 'dark' ? 'border border-gray-600' : 'border border-gray-200'
                      }`}>
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
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h5 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.name}</h5>
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{item.category}</p>
                        <div className="flex justify-between mt-1">
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Cantidad: {item.quantity}</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Precio unitario: {formatCurrency(item.price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Resumen del Pedido</h4>
              <div className={`rounded-lg p-4 space-y-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Subtotal</p>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.subtotal || 0)}</p>
                </div>
                {order.coupon && (
                  <div className="flex justify-between">
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Descuento ({order.coupon.code})</p>
                    <p className={`font-medium ${
                      theme === 'dark' ? 'text-green-200' : 'text-green-600'
                    }`}>-{formatCurrency(order.discount || 0)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Envío</p>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>$0</p>
                </div>
                <div className={`flex justify-between pt-2 border-t ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total</p>
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.totalAmount || 0)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                theme === 'dark'
                  ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              }`}
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