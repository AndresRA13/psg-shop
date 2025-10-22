import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore";

const CouponManager = ({ theme = 'light' }) => {
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
      // Validate and handle expiryDate properly
      let expiryDateValue = null;
      if (newCoupon.expiryDate) {
        if (newCoupon.expiryDate instanceof Date) {
          expiryDateValue = newCoupon.expiryDate;
        } else {
          // Try to create a Date object from the string
          const dateObj = new Date(newCoupon.expiryDate);
          // Check if the date is valid
          if (!isNaN(dateObj.getTime())) {
            expiryDateValue = dateObj;
          }
        }
      }

      const couponData = {
        code: newCoupon.code.toUpperCase(),
        discountType: newCoupon.discountType,
        discountValue: parseFloat(newCoupon.discountValue),
        isActive: newCoupon.isActive,
        createdAt: new Date(),
        ...(expiryDateValue && { expiryDate: expiryDateValue })
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
      // Validate and handle expiryDate properly
      let expiryDateValue = null;
      if (editingCoupon.expiryDate) {
        if (editingCoupon.expiryDate instanceof Date) {
          expiryDateValue = editingCoupon.expiryDate;
        } else {
          // Try to create a Date object from the string
          const dateObj = new Date(editingCoupon.expiryDate);
          // Check if the date is valid
          if (!isNaN(dateObj.getTime())) {
            expiryDateValue = dateObj;
          }
        }
      }

      const updateData = {
        code: editingCoupon.code.toUpperCase(),
        discountType: editingCoupon.discountType,
        discountValue: parseFloat(editingCoupon.discountValue),
        isActive: editingCoupon.isActive,
        updatedAt: new Date(),
        ...(expiryDateValue && { expiryDate: expiryDateValue })
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

  // Theme-based classes
  const getThemeClasses = () => {
    return {
      container: theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900',
      header: theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-900',
      input: theme === 'dark' 
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500',
      buttonPrimary: theme === 'dark' 
        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white' 
        : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white',
      buttonSecondary: theme === 'dark' 
        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 focus:ring-blue-500' 
        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
      tableHeader: theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500',
      tableRow: theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 divide-gray-700' : 'bg-white hover:bg-gray-50 divide-gray-200',
      badge: {
        percentage: theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800',
        active: theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
        inactive: theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
      },
      successMessage: theme === 'dark' ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-100 border-green-400 text-green-700',
      errorMessage: theme === 'dark' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'
    };
  };

  const themeClasses = getThemeClasses();

  return (
    <div className="mt-8">
      {/* Success Message */}
      {successMessage && (
        <div className={`relative px-4 py-3 mb-4 rounded ${themeClasses.successMessage}`} role="alert">
          <strong className="font-bold">Éxito! </strong>
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className={`relative px-4 py-3 mb-4 rounded ${themeClasses.errorMessage}`} role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Add Coupon Form */}
      <div className={`rounded-lg shadow overflow-hidden mb-8 ${themeClasses.container}`}>
        <div className={`px-4 py-5 border-b sm:px-6 ${themeClasses.header}`}>
          <h3 className="text-lg font-medium leading-6">
            {editingCoupon ? 'Editar Cupón' : 'Agregar Nuevo Cupón'}
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={editingCoupon ? saveEdit : createCoupon}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="code" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  name="code"
                  id="code"
                  required
                  value={editingCoupon ? editingCoupon.code : newCoupon.code}
                  onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm ${themeClasses.input}`}
                  placeholder="Ej: DESCUENTO10"
                />
              </div>
              
              <div>
                <label htmlFor="discountType" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tipo de Descuento *
                </label>
                <select
                  name="discountType"
                  id="discountType"
                  required
                  value={editingCoupon ? editingCoupon.discountType : newCoupon.discountType}
                  onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                  className={`mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm ${themeClasses.input}`}
                >
                  <option value="percentage" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Porcentaje</option>
                  <option value="fixed" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>Monto Fijo</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="discountValue" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm ${themeClasses.input}`}
                  placeholder={editingCoupon ? 
                    (editingCoupon.discountType === 'percentage' ? 'Ej: 15' : 'Ej: 5000') : 
                    (newCoupon.discountType === 'percentage' ? 'Ej: 15' : 'Ej: 5000')}
                />
                <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {editingCoupon ? 
                    (editingCoupon.discountType === 'percentage' ? 'Porcentaje de descuento (1-100%)' : 'Monto fijo en COP') : 
                    (newCoupon.discountType === 'percentage' ? 'Porcentaje de descuento (1-100%)' : 'Monto fijo en COP')}
                </p>
              </div>
              
              <div>
                <label htmlFor="expiryDate" className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha de Expiración
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  id="expiryDate"
                  value={editingCoupon ? editingCoupon.expiryDate : newCoupon.expiryDate}
                  onChange={editingCoupon ? handleEditCouponChange : handleNewCouponChange}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm ${themeClasses.input}`}
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
                    className={`h-4 w-4 focus:ring-2 focus:ring-offset-2 ${
                      theme === 'dark' 
                        ? 'text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800' 
                        : 'text-indigo-600 border-gray-300 focus:ring-indigo-500 focus:ring-offset-white'
                    } rounded`}
                  />
                  <label htmlFor="isActive" className={`ml-2 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
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
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.buttonPrimary}`}
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className={`inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.buttonSecondary}`}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.buttonPrimary}`}
                >
                  Crear Cupón
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Coupons List */}
      <div className={`rounded-lg shadow overflow-hidden ${themeClasses.container}`}>
        <div className={`px-4 py-5 border-b sm:px-6 ${themeClasses.header}`}>
          <h3 className="text-lg font-medium leading-6">
            Cupones Existentes
          </h3>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className={themeClasses.tableHeader}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase">Código</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase">Valor</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase">Estado</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left uppercase">Expiración</th>
                  <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${themeClasses.tableRow}`}>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className={`w-6 h-6 border-b-2 rounded-full animate-spin ${
                          theme === 'dark' ? 'border-gray-400' : 'border-gray-900'
                        }`}></div>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className={`px-6 py-4 text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`}>{error}</td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={`px-6 py-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No hay cupones disponibles</td>
                  </tr>
                ) : (
                  coupons.map((coupon) => (
                    <tr key={coupon.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {coupon.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${themeClasses.badge.percentage}`}>
                          {coupon.discountType === 'percentage' ? 'Porcentaje' : 'Monto Fijo'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}%` 
                          : formatCurrency(coupon.discountValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {coupon.isActive ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${themeClasses.badge.active}`}>
                            Activo
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${themeClasses.badge.inactive}`}>
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        {coupon.expiryDate ? formatDate(coupon.expiryDate) : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingCoupon(coupon)}
                          className={`mr-3 ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'}`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteCoupon(coupon.id, coupon.code)}
                          className={theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'}
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