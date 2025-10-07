import React from 'react';

const OrderDetailsModal = ({ order, isOpen, onClose, formatDate, formatCurrency, getOrderStatusText, getStatusBadgeClass }) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">Detalles de la Orden</h3>
            <button
              onClick={onClose}
              className="text-2xl font-bold text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </div>
          
          <div className="mt-2 space-y-6">
            {/* Order Info */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Información de la Orden</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">ID de Orden</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus || 'pending')}`}>
                      {getOrderStatusText(order.orderStatus || 'pending')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Método de Pago</p>
                    <p className="font-medium">{order.paymentMethod || 'N/A'}</p>
                    <p className="text-sm text-gray-500">
                      {order.paymentStatus === 'completed' ? 'Pagado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Customer Info */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Información del Cliente</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombre</p>
                    <p className="font-medium">{order.userEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID de Usuario</p>
                    <p className="font-medium">{order.userId?.substring(0, 8) || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Shipping Address */}
            {order.address && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Dirección de Envío</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">{order.address.name}</p>
                  <p>{order.address.street}</p>
                  <p>{order.address.city}, {order.address.state} {order.address.zipCode}</p>
                  <p>{order.address.country}</p>
                </div>
              </div>
            )}
            
            {/* Coupon Info */}
            {order.coupon && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Cupón de Descuento</h4>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Código</p>
                      <p className="font-medium">{order.coupon.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Descuento</p>
                      <p className="font-medium">
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
              <h4 className="text-lg font-medium text-gray-900 mb-2">Productos</h4>
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                {order.items?.map((item, index) => (
                  <div key={index} className="p-4">
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
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h5 className="font-medium text-gray-900">{item.name}</h5>
                          <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <p className="text-sm text-gray-500">{item.category}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                          <p className="text-sm text-gray-500">Precio unitario: {formatCurrency(item.price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Order Summary */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Resumen del Pedido</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-medium">{formatCurrency(order.subtotal || 0)}</p>
                </div>
                {order.coupon && (
                  <div className="flex justify-between">
                    <p className="text-gray-600">Descuento ({order.coupon.code})</p>
                    <p className="font-medium text-green-600">-{formatCurrency(order.discount || 0)}</p>
                  </div>
                )}
                <div className="flex justify-between">
                  <p className="text-gray-600">Envío</p>
                  <p className="font-medium">$0</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <p className="text-lg font-medium text-gray-900">Total</p>
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(order.totalAmount || 0)}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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