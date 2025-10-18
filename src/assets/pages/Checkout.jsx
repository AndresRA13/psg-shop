import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

const Checkout = () => {
  const { items, getTotalPrice, loading: cartLoading, clearCart, coupon } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Exchange rate for COP to USD (you might want to fetch this dynamically)
  const EXCHANGE_RATE = 0.00028; // 1 USD = 3570 COP (approximate)
  
  // Convert COP to USD
  const convertToUSD = (copAmount) => {
    return copAmount * EXCHANGE_RATE;
  };

  // Get the primary image URL for a product
  const getPrimaryImageUrl = (product) => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      // Filter out empty images
      const validImages = product.imageUrls.filter(image => 
        image && (typeof image === 'string' || (image.data && typeof image.data === 'string'))
      );
      if (validImages.length > 0) {
        const primaryIndex = product.primaryImageIndex || 0;
        // Ensure primaryIndex is within bounds
        const safeIndex = Math.min(primaryIndex, validImages.length - 1);
        const primaryImage = validImages[safeIndex];
        
        // Handle both string URLs and base64 data objects
        if (typeof primaryImage === 'string') {
          return primaryImage;
        } else if (primaryImage && primaryImage.data) {
          return primaryImage.data;
        }
      }
    }
    return product.imageUrl || 'https://via.placeholder.com/100x100.png?text=Moño';
  };

  // State for addresses and checkout
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Colombia'
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const discount = coupon ? subtotal - getTotalPrice() : 0;
  const total = getTotalPrice();
  
  // Load user addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userAddresses = userData.addresses || [];
          setAddresses(userAddresses);
          
          // Set default address if exists
          const defaultAddress = userAddresses.find(addr => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
          } else if (userAddresses.length > 0) {
            setSelectedAddress(userAddresses[0]);
          }
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar las direcciones',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadAddresses();
  }, [currentUser, navigate]);
  
  // Handle new address input changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle new address submission
  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa todos los campos de la dirección',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    try {
      // Save address to Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newAddressWithId = {
        ...newAddress,
        id: Date.now(),
        isDefault: addresses.length === 0 // First address is default
      };
      
      // Update user document with new address
      await updateDoc(userDocRef, {
        addresses: [...addresses, newAddressWithId]
      });
      
      const updatedAddresses = [...addresses, newAddressWithId];
      setAddresses(updatedAddresses);
      setSelectedAddress(newAddressWithId);
      setShowNewAddressForm(false);
      
      // Reset form
      setNewAddress({
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Colombia'
      });
      
      Swal.fire({
        title: 'Dirección agregada',
        text: 'La dirección se ha agregado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error adding address:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al agregar la dirección: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
  // Create order in Firestore
  const createOrder = async (paymentMethod, paymentStatus) => {
    try {
      // Convert total to USD for PayPal payments
      const totalInUSD = convertToUSD(total);
      
      const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: items,
        subtotal: parseFloat(subtotal),
        discount: parseFloat(discount),
        totalAmount: parseFloat(total),
        totalAmountUSD: parseFloat(totalInUSD.toFixed(2)), // Store USD amount for PayPal payments
        address: selectedAddress,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        orderStatus: 'pending',
        coupon: coupon || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add order to Firestore
      const ordersCollectionRef = collection(db, 'orders');
      const orderDocRef = await addDoc(ordersCollectionRef, orderData);
      
      console.log('Order created with ID:', orderDocRef.id);
      return orderDocRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };
  
  // Handle PayPal payment success
  const handlePayPalSuccess = (data, actions) => {
    return actions.order.capture().then(async (details) => {
      setProcessing(true);
      
      try {
        // Create order in Firestore
        await createOrder('PayPal', 'completed');
        
        // Clear cart
        clearCart();
        
        Swal.fire({
          title: '¡Pago exitoso!',
          text: `Gracias por tu compra, ${details.payer.name.given_name}!`,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          // Redirect to home or order confirmation page
          navigate('/home');
        });
      } catch (error) {
        console.error('Error processing order:', error);
        Swal.fire({
          title: 'Error',
          text: 'Hubo un error al procesar tu pedido. Por favor contacta al soporte.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      } finally {
        setProcessing(false);
      }
    });
  };
  
  // Handle PayPal payment error
  const handlePayPalError = (err) => {
    console.error('PayPal payment error:', err);
    Swal.fire({
      title: 'Error',
      text: 'Hubo un error al procesar el pago con PayPal. Por favor intenta nuevamente.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
  };
  
  // Handle cash on delivery
  const handleCashOnDelivery = async () => {
    if (!selectedAddress) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor selecciona una dirección de envío',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }
    
    setProcessing(true);
    
    try {
      // Create order in Firestore
      await createOrder('Cash on Delivery', 'pending');
      
      // Clear cart
      clearCart();
      
      // Show success message
      Swal.fire({
        title: 'Pedido confirmado',
        text: 'Tu pedido ha sido confirmado. Pagarás contra entrega.',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        // Redirect to order confirmation or home
        navigate('/home');
      });
    } catch (error) {
      console.error('Error processing order:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al procesar el pedido: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setProcessing(false);
    }
  };
  
  if (cartLoading || loading) {
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
  
  // Redirect to cart if empty
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }
  
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Left Column - Address Selection and Order Summary */}
          <div className="lg:col-span-8">
            {/* Shipping Address Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-4 py-6 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Dirección de Envío</h2>
                
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay direcciones guardadas</h3>
                    <p className="mt-1 text-sm text-gray-500">Agrega una nueva dirección para continuar.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div 
                        key={address.id} 
                        className={`border rounded-lg p-4 cursor-pointer ${
                          selectedAddress && selectedAddress.id === address.id 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddress(address)}
                      >
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              name="address"
                              checked={selectedAddress && selectedAddress.id === address.id}
                              onChange={() => setSelectedAddress(address)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                            />
                          </div>
                          <div className="ml-3">
                            <label className="block text-sm font-medium text-gray-700">
                              {address.name}
                              {address.isDefault && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  Predeterminada
                                </span>
                              )}
                            </label>
                            <div className="mt-1 text-sm text-gray-500">
                              <p>{address.street}</p>
                              <p>{address.city}, {address.state} {address.zipCode}</p>
                              <p>{address.country}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {addresses.length === 0 ? 'Agregar Dirección' : 'Agregar Nueva Dirección'}
                  </button>
                </div>
                
                {/* New Address Form */}
                {showNewAddressForm && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      {addresses.length === 0 ? 'Agregar Dirección' : 'Nueva Dirección'}
                    </h3>
                    <form onSubmit={handleAddNewAddress}>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Nombre de la Dirección
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={newAddress.name}
                            onChange={handleAddressChange}
                            placeholder="Ej: Casa, Trabajo"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                            Calle y Número
                          </label>
                          <input
                            type="text"
                            name="street"
                            id="street"
                            value={newAddress.street}
                            onChange={handleAddressChange}
                            placeholder="Ej: Av. Principal 123"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                            Ciudad
                          </label>
                          <input
                            type="text"
                            name="city"
                            id="city"
                            value={newAddress.city}
                            onChange={handleAddressChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                            Estado/Provincia
                          </label>
                          <input
                            type="text"
                            name="state"
                            id="state"
                            value={newAddress.state}
                            onChange={handleAddressChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                            Código Postal
                          </label>
                          <input
                            type="text"
                            name="zipCode"
                            id="zipCode"
                            value={newAddress.zipCode}
                            onChange={handleAddressChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                            País
                          </label>
                          <input
                            type="text"
                            name="country"
                            id="country"
                            value={newAddress.country}
                            onChange={handleAddressChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 flex space-x-3">
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Guardar Dirección
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
            
            {/* Order Summary Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-6 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen del Pedido</h2>
                
                <div className="flow-root">
                  <ul className="-my-6 divide-y divide-gray-200">
                    {items.map((item) => (
                      <li key={item.id} className="py-6 flex">
                        <div className="flex-shrink-0 w-24 h-24 border border-gray-200 rounded-md overflow-hidden">
                          <img
                            src={getPrimaryImageUrl(item)}
                            alt={item.name}
                            className="w-full h-full object-center object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/100x100.png?text=Moño';
                            }}
                          />
                        </div>

                        <div className="ml-4 flex-1 flex flex-col">
                          <div>
                            <div className="flex justify-between text-base font-medium text-gray-900">
                              <h3>{item.name}</h3>
                              <p className="ml-4">${parseFloat(item.price * item.quantity).toLocaleString('es-CO')}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                          </div>
                          <div className="flex-1 flex items-end justify-between text-sm">
                            <p className="text-gray-500">Cantidad: {item.quantity}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Payment Summary */}
          <div className="mt-8 lg:mt-0 lg:col-span-4">
            <div className="bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Resumen del Pedido</h2>
              
              <dl className="space-y-6">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">${parseFloat(subtotal).toLocaleString('es-CO')}</dd>
                </div>
                
                {coupon && (
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-600">Descuento ({coupon.code})</dt>
                    <dd className="text-sm font-medium text-green-600">-${parseFloat(discount).toLocaleString('es-CO')}</dd>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Envío</dt>
                  <dd className="text-sm font-medium text-gray-900">$0</dd>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-base font-medium text-gray-900">${parseFloat(total).toLocaleString('es-CO')}</dd>
                </div>
              </dl>
              
              {/* Selected Address Preview */}
              {selectedAddress && (
                <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Dirección de Envío</h3>
                  <div className="text-sm text-gray-500">
                    <p className="font-medium">{selectedAddress.name}</p>
                    <p>{selectedAddress.street}</p>
                    <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}</p>
                    <p>{selectedAddress.country}</p>
                  </div>
                </div>
              )}
              
              {/* Payment Methods */}
              <div className="mt-8">
                <h3 className="text-md font-medium text-gray-900 mb-4">Método de Pago</h3>
                
                <div className="space-y-4">
                  {/* PayPal Button */}
                  <div className="w-full">
                    {selectedAddress ? (
                      <PayPalButtons
                        style={{ layout: 'vertical' }}
                        createOrder={(data, actions) => {
                          // Convert total from COP to USD for PayPal
                          const totalInUSD = convertToUSD(total);
                          return actions.order.create({
                            purchase_units: [
                              {
                                amount: {
                                  value: totalInUSD.toFixed(2),
                                  currency_code: 'USD'
                                }
                              }
                            ]
                          });
                        }}
                        onApprove={handlePayPalSuccess}
                        onError={handlePayPalError}
                      />
                    ) : (
                      <button
                        disabled
                        className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white opacity-50 cursor-not-allowed"
                      >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#253b80" d="M35.71 15.39c.27-.4.4-.87.36-1.35-.04-.48-.24-.93-.57-1.28-.33-.35-.76-.55-1.22-.56-.46 0-.89.19-1.22.53-.33.34-.52.8-.54 1.28-.02.48.12.94.4 1.33.28.39.68.67 1.14.8.46.13.95.1 1.4-.08.45-.18.84-.49 1.12-.89z"/>
                          <path fill="#179bd7" d="M13.34 15.96c.34-.46.52-1.02.51-1.59-.01-.57-.22-1.12-.59-1.54-.28-.42-.72-.81-1.23-.96-.51-.15-1-.08-1.46.09-.46.17-.85.49-1.11.89-.27.4-.37.93-.32 1.44.03.51.21.99.51 1.4.3.41.74.72 1.23.88.49.16 1.01.17 1.51.06.5-.12.94-.4 1.26-.78z"/>
                          <path fill="#253b80" d="M22.72 16.11c.41-.36.67-.87.72-1.41.05-.54-.03-1.08-.31-1.55-.28-.42-.72-.81-1.23-.96-.51-.15-1-.08-1.46.09-.46.17-.85.49-1.11.89-.26.4-.37.88-.32 1.37.05.49.27.95.61 1.31.34.36.79.6 1.28.68.49.08 1-.01 1.44-.24z"/>
                          <path fill="#179bd7" d="M30.21 16.26c.45-.31.75-.8.83-1.34.08-.54-.03-1.09-.31-1.55-.28-.42-.72-.81-1.23-.96-.51-.15-1-.08-1.46.09-.46.17-.85.49-1.11.89-.26.4-.37.88-.32 1.37.05.49.27.95.61 1.31.34.36.79.6 1.28.68.49.08 1-.01 1.44-.24z"/>
                          <path fill="#253b80" d="M5.39 16.39c.47-.23.81-.66.93-1.16.12-.5.03-1.03-.25-1.45-.28-.42-.71-.71-1.2-.82-.49-.11-1-.08-1.46.09-.46.17-.85.49-1.11.89-.26.4-.37.88-.32 1.37.05.49.27.95.61 1.31.34.36.79.6 1.28.68.49.08 1-.01 1.44-.24z"/>
                        </svg>
                        Pagar con PayPal
                      </button>
                    )}
                  </div>
                  
                  {/* Cash on Delivery Button */}
                  <button
                    onClick={handleCashOnDelivery}
                    disabled={processing || !selectedAddress}
                    className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      processing || !selectedAddress ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {processing ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    Pagar Contra Entrega
                  </button>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/cart')}
                  className="text-indigo-600 hover:text-indigo-500"
                >
                  &larr; Volver al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;