import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state for new coupon
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    isActive: true,
    expiryDate: ''
  });
  
  // Form state for editing coupon
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const couponsCollectionRef = collection(db, "coupons");

  // Fetch all coupons
  const fetchCoupons = async () => {
    try {
      const couponsQuery = query(couponsCollectionRef, orderBy("createdAt", "desc"));
      const data = await getDocs(couponsQuery);
      setCoupons(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      console.error("Firebase error fetching coupons: ", err);
      setError("No se pudieron cargar los cupones. Revisa las reglas de seguridad de Firebase y la consola del navegador.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle form input changes for new coupon
  const handleNewCouponChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCoupon({
      ...newCoupon,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form input changes for editing coupon
  const handleEditCouponChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingCoupon({
      ...editingCoupon,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Create a new coupon
  const createCoupon = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newCoupon.code || !newCoupon.discountValue) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }
    
    if (newCoupon.discountType === 'percentage' && (newCoupon.discountValue < 1 || newCoupon.discountValue > 100)) {
      setError("El porcentaje de descuento debe estar entre 1 y 100.");
      return;
    }
    
    try {
      const couponData = {
        code: newCoupon.code.toUpperCase(),
        discountType: newCoupon.discountType,
        discountValue: parseFloat(newCoupon.discountValue),
        isActive: newCoupon.isActive,
        createdAt: new Date(),
        ...(newCoupon.expiryDate && { expiryDate: new Date(newCoupon.expiryDate) })
      };
      
      await addDoc(couponsCollectionRef, couponData);
      
      // Reset form
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        isActive: true,
        expiryDate: ''
      });
      
      setError(null);
      showSuccessMessage("Cupón creado exitosamente!");
      fetchCoupons(); // Refresh coupons list
    } catch (err) {
      console.error("Firebase error creating coupon: ", err);
      setError("Error al crear el cupón. ¿Tienes permisos de escritura?");
    }
  };

  // Delete a coupon
  const deleteCoupon = async (id, code) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar el cupón "${code}"?`);
    if (!confirmDelete) return;

    try {
      const couponDoc = doc(db, "coupons", id);
      await deleteDoc(couponDoc);
      setCoupons(coupons.filter((coupon) => coupon.id !== id));
      showSuccessMessage("Cupón eliminado exitosamente!");
    } catch (err) {
      console.error("Firebase error deleting coupon: ", err);
      setError("Error al eliminar el cupón. ¿Tienes permisos de escritura?");
    }
  };

  // Update a coupon
  const saveEdit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editingCoupon.code || !editingCoupon.discountValue) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }
    
    if (editingCoupon.discountType === 'percentage' && (editingCoupon.discountValue < 1 || editingCoupon.discountValue > 100)) {
      setError("El porcentaje de descuento debe estar entre 1 y 100.");
      return;
    }
    
    try {
      const couponDoc = doc(db, "coupons", editingCoupon.id);
      const updateData = {
        code: editingCoupon.code.toUpperCase(),
        discountType: editingCoupon.discountType,
        discountValue: parseFloat(editingCoupon.discountValue),
        isActive: editingCoupon.isActive,
        updatedAt: new Date(),
        ...(editingCoupon.expiryDate && { expiryDate: new Date(editingCoupon.expiryDate) })
      };
      
      await updateDoc(couponDoc, updateData);
      
      setEditingCoupon(null);
      setError(null);
      showSuccessMessage("Cupón actualizado exitosamente!");
      fetchCoupons(); // Refresh coupons list
    } catch (err) {
      console.error("Firebase error updating coupon: ", err);
      setError("Error al actualizar el cupón. ¿Tienes permisos de escritura?");
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="mt-8">
      {/* Success Message */}
      {successMessage && (
        <div className="relative px-4 py-3 mb-4 text-green-700 bg-green-100 border border-green-400 rounded" role="alert">
          <strong className="font-bold">Éxito! </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="relative px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Add Coupon Form */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {editingCoupon ? 'Editar Cupón' : 'Agregar Nuevo Cupón'}
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={editingCoupon ? saveEdit : createCoupon}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  name="code"
                  id="code"
                  required
                  value={editingCoupon ? editingCoupon.code : newCoupon.code}
                  onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ej: DESCUENTO10"
                />
              </div>
              
              <div>
                <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                  Tipo de Descuento *
                </label>
                <select
                  name="discountType"
                  id="discountType"
                  required
                  value={editingCoupon ? editingCoupon.discountType : newCoupon.discountType}
                  onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="percentage">Porcentaje</option>
                  <option value="fixed">Monto Fijo</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
                  Valor del Descuento *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  id="discountValue"
                  required
                  min="0"
                  step="0.01"
                  value={editingCoupon ? editingCoupon.discountValue : newCoupon.discountValue}
                  onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder={editingCoupon ? 
                    (editingCoupon.discountType === 'percentage' ? 'Ej: 15' : 'Ej: 5000') : 
                    (newCoupon.discountType === 'percentage' ? 'Ej: 15' : 'Ej: 5000')}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {editingCoupon ? 
                    (editingCoupon.discountType === 'percentage' ? 'Porcentaje de descuento (1-100%)' : 'Monto fijo en COP') : 
                    (newCoupon.discountType === 'percentage' ? 'Porcentaje de descuento (1-100%)' : 'Monto fijo en COP')}
                </p>
              </div>
              
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  id="expiryDate"
                  value={editingCoupon ? editingCoupon.expiryDate : newCoupon.expiryDate}
                  onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    id="isActive"
                    name="isActive"
                    type="checkbox"
                    checked={editingCoupon ? editingCoupon.isActive : newCoupon.isActive}
                    onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Cupón Activo
                  </label>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              {editingCoupon ? (
                <>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Crear Cupón
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Cupones Existentes</h3>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Código</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Valor</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Estado</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Expiración</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-red-500">{error}</td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay cupones disponibles</td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {coupon.discountType === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}%` 
                          : formatCurrency(coupon.discountValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coupon.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {coupon.expiryDate ? formatDate(coupon.expiryDate) : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingCoupon(coupon)}
                          className="mr-3 text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteCoupon(coupon.id, coupon.code)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponManager;