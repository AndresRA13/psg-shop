import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Swal from 'sweetalert2';

const Profile = () => {
  const { currentUser, userRole, refreshUserData } = useAuth();
  const navigate = useNavigate();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phone: '',
    profileImage: ''
  });
  
  // Security state
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    id: Date.now(),
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false
  });
  
  // Editing address state
  const [editingAddress, setEditingAddress] = useState(null);
  const [editAddressData, setEditAddressData] = useState({
    id: null,
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    isDefault: false
  });
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  
  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setProfileData({
            displayName: userData.displayName || currentUser.displayName || '',
            email: currentUser.email,
            phone: userData.phone || '',
            profileImage: userData.profileImage || currentUser.photoURL || ''
          });
          
          setAddresses(userData.addresses || []);
        } else {
          // If no profile exists, initialize with basic data from Firebase user
          setProfileData({
            displayName: currentUser.displayName || '',
            email: currentUser.email,
            phone: '',
            profileImage: currentUser.photoURL || ''
          });
          setAddresses([]);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Swal.fire({
          title: 'Error',
          text: 'Error al cargar el perfil',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, [currentUser, navigate]);
  
  // Handle profile input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle security input changes
  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle address input changes for new address
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle address input changes for editing address
  const handleEditAddressChange = (e) => {
    const { name, value } = e.target;
    setEditAddressData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          title: 'Archivo muy grande',
          text: 'La imagen debe ser menor a 2MB',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        Swal.fire({
          title: 'Tipo de archivo inválido',
          text: 'Por favor selecciona una imagen',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
      
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Save profile data
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Get the existing user document to preserve fields like 'role'
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      // Start with the profile data
      let userDataToSave = {
        ...profileData,
        updatedAt: new Date()
      };
      
      // Preserve existing fields that shouldn't be overwritten
      if (userDocSnap.exists()) {
        const existingData = userDocSnap.data();
        // Preserve the role field to maintain admin status
        if (existingData.hasOwnProperty('role')) {
          userDataToSave.role = existingData.role;
        }
        // Preserve createdAt field if it exists
        if (existingData.hasOwnProperty('createdAt')) {
          userDataToSave.createdAt = existingData.createdAt;
        }
        // Preserve addresses if they exist
        if (existingData.hasOwnProperty('addresses')) {
          userDataToSave.addresses = existingData.addresses;
        }
      } else {
        // For new users, set the default role as customer
        userDataToSave.role = 'customer';
        userDataToSave.createdAt = new Date();
        userDataToSave.addresses = [];
      }
      
      await setDoc(userDocRef, userDataToSave);
      
      console.log('Profile saved, refreshing user data');
      // Refresh user data in the auth context to ensure UI updates
      refreshUserData();
      
      Swal.fire({
        title: 'Perfil actualizado',
        text: 'Tu perfil se ha actualizado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al guardar el perfil: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecuritySaving(true);
    
    // Validate passwords
    if (securityData.newPassword !== securityData.confirmNewPassword) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas nuevas no coinciden',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      setSecuritySaving(false);
      return;
    }
    
    if (securityData.newPassword.length < 6) {
      Swal.fire({
        title: 'Error',
        text: 'La nueva contraseña debe tener al menos 6 caracteres',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      setSecuritySaving(false);
      return;
    }
    
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        securityData.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, securityData.newPassword);
      
      Swal.fire({
        title: 'Contraseña actualizada',
        text: 'Tu contraseña se ha actualizado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      
      // Reset security form
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      let errorMessage = 'Error al cambiar la contraseña';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'La contraseña actual es incorrecta';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Por favor, inténtalo más tarde';
          break;
        default:
          errorMessage = 'Error al cambiar la contraseña: ' + error.message;
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setSecuritySaving(false);
    }
  };
  
  // Add new address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    
    // Validate required fields
    if (!newAddress.name || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode || !newAddress.country) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa todos los campos de la dirección',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      setAddressSaving(false);
      return;
    }
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newAddressWithId = {
        ...newAddress,
        id: Date.now()
      };
      
      // If this is the first address or marked as default, make it default
      if (addresses.length === 0 || newAddress.isDefault) {
        newAddressWithId.isDefault = true;
        // Remove default from other addresses
        const updatedAddresses = addresses.map(addr => ({
          ...addr,
          isDefault: false
        }));
        setAddresses([...updatedAddresses, newAddressWithId]);
      } else {
        setAddresses([...addresses, newAddressWithId]);
      }
      
      // Update in Firestore
      await updateDoc(userDocRef, {
        addresses: arrayUnion(newAddressWithId)
      });
      
      Swal.fire({
        title: 'Dirección agregada',
        text: 'La dirección se ha agregado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      
      // Reset form
      setNewAddress({
        id: Date.now(),
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
      });
    } catch (error) {
      console.error('Error adding address:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al agregar la dirección: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setAddressSaving(false);
    }
  };
  
  // Start editing an address
  const startEditingAddress = (address) => {
    setEditingAddress(address.id);
    setEditAddressData({...address});
  };
  
  // Cancel editing an address
  const cancelEditingAddress = () => {
    setEditingAddress(null);
    setEditAddressData({
      id: null,
      name: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      isDefault: false
    });
  };
  
  // Save edited address
  const saveEditedAddress = async (e) => {
    e.preventDefault();
    setAddressSaving(true);
    
    // Validate required fields
    if (!editAddressData.name || !editAddressData.street || !editAddressData.city || !editAddressData.state || !editAddressData.zipCode || !editAddressData.country) {
      Swal.fire({
        title: 'Error',
        text: 'Por favor completa todos los campos de la dirección',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      setAddressSaving(false);
      return;
    }
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Remove old address
      const addressToRemove = addresses.find(addr => addr.id === editAddressData.id);
      if (addressToRemove) {
        await updateDoc(userDocRef, {
          addresses: arrayRemove(addressToRemove)
        });
      }
      
      // Add updated address
      const updatedAddressWithId = {
        ...editAddressData
      };
      
      await updateDoc(userDocRef, {
        addresses: arrayUnion(updatedAddressWithId)
      });
      
      // Update state
      setAddresses(addresses.map(addr => 
        addr.id === editAddressData.id ? updatedAddressWithId : addr
      ));
      
      Swal.fire({
        title: 'Dirección actualizada',
        text: 'La dirección se ha actualizado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      
      // Reset editing state
      setEditingAddress(null);
      setEditAddressData({
        id: null,
        name: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        isDefault: false
      });
    } catch (error) {
      console.error('Error updating address:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar la dirección: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setAddressSaving(false);
    }
  };
  
  // Edit address
  const handleEditAddress = async (addressId, updatedAddress) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Remove old address
      const addressToRemove = addresses.find(addr => addr.id === addressId);
      if (addressToRemove) {
        await updateDoc(userDocRef, {
          addresses: arrayRemove(addressToRemove)
        });
      }
      
      // Add updated address
      const updatedAddressWithId = {
        ...updatedAddress,
        id: addressId
      };
      
      await updateDoc(userDocRef, {
        addresses: arrayUnion(updatedAddressWithId)
      });
      
      // Update state
      setAddresses(addresses.map(addr => 
        addr.id === addressId ? updatedAddressWithId : addr
      ));
      
      Swal.fire({
        title: 'Dirección actualizada',
        text: 'La dirección se ha actualizado correctamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error updating address:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al actualizar la dirección: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
  // Delete address
  const handleDeleteAddress = async (addressId) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const addressToDelete = addresses.find(addr => addr.id === addressId);
          
          if (addressToDelete) {
            await updateDoc(userDocRef, {
              addresses: arrayRemove(addressToDelete)
            });
            
            // Update state
            setAddresses(addresses.filter(addr => addr.id !== addressId));
            
            Swal.fire({
              title: 'Dirección eliminada',
              text: 'La dirección se ha eliminado correctamente',
              icon: 'success',
              confirmButtonText: 'Aceptar'
            });
          }
        } catch (error) {
          console.error('Error deleting address:', error);
          Swal.fire({
            title: 'Error',
            text: 'Error al eliminar la dirección: ' + error.message,
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  };
  
  // Set address as default
  const handleSetDefaultAddress = async (addressId) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Update addresses in state
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      }));
      
      setAddresses(updatedAddresses);
      
      // Update all addresses in Firestore
      await updateDoc(userDocRef, {
        addresses: updatedAddresses
      });
      
      Swal.fire({
        title: 'Dirección predeterminada',
        text: 'La dirección se ha establecido como predeterminada',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      Swal.fire({
        title: 'Error',
        text: 'Error al establecer la dirección predeterminada: ' + error.message,
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
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
  
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Perfil</h1>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Seguridad
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'addresses'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Direcciones
              </button>
            </nav>
          </div>
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-8">
                <form onSubmit={handleSaveProfile}>
                  {/* Profile Image Section */}
                  <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Foto de Perfil</h2>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {profileData.profileImage ? (
                          <img 
                            src={profileData.profileImage} 
                            alt="Profile" 
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-3xl font-bold">
                              {profileData.displayName?.charAt(0) || profileData.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-6">
                        <label className="block">
                          <span className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                            Cambiar foto
                          </span>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="mt-2 text-sm text-gray-500">
                          JPG, GIF o PNG. Tamaño máximo 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Personal Information */}
                  <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          name="displayName"
                          id="displayName"
                          value={profileData.displayName}
                          onChange={handleProfileChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={profileData.email}
                          disabled
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          El correo no puede ser modificado
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      {/* Role Display (Read-only) */}
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Rol
                        </label>
                        <input
                          type="text"
                          name="role"
                          id="role"
                          value={userRole || 'customer'}
                          disabled
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          El rol no puede ser modificado
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-8">
                <form onSubmit={handleChangePassword}>
                  <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cambiar Contraseña</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                          Contraseña Actual
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          value={securityData.currentPassword}
                          onChange={handleSecurityChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          value={securityData.newPassword}
                          onChange={handleSecurityChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                          Confirmar Nueva Contraseña
                        </label>
                        <input
                          type="password"
                          name="confirmNewPassword"
                          id="confirmNewPassword"
                          value={securityData.confirmNewPassword}
                          onChange={handleSecurityChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={securitySaving}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {securitySaving ? 'Guardando...' : 'Cambiar Contraseña'}
                    </button>
                  </div>
                </form>
                
                {/* Active Devices Section */}
                <div className="mt-12">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Dispositivos Activos</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Este dispositivo</h3>
                        <p className="text-sm text-gray-500">Última actividad: Ahora mismo</p>
                      </div>
                      <div className="ml-auto">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Activo
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Para seguridad adicional, si ves un dispositivo que no reconoces, cierra la sesión en todos los dispositivos y cambia tu contraseña.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-8">
                {/* Add/Edit Address Form */}
                <div className="mb-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {editingAddress ? 'Editar Dirección' : 'Agregar Nueva Dirección'}
                  </h2>
                  <form onSubmit={editingAddress ? saveEditedAddress : handleAddAddress}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="addressName" className="block text-sm font-medium text-gray-700">
                          Nombre de la Dirección
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="addressName"
                          value={editingAddress ? editAddressData.name : newAddress.name}
                          onChange={editingAddress ? handleEditAddressChange : handleAddressChange}
                          placeholder="Ej: Casa, Trabajo"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="addressStreet" className="block text-sm font-medium text-gray-700">
                          Calle y Número
                        </label>
                        <input
                          type="text"
                          name="street"
                          id="addressStreet"
                          value={editingAddress ? editAddressData.street : newAddress.street}
                          onChange={editingAddress ? handleEditAddressChange : handleAddressChange}
                          placeholder="Ej: Av. Principal 123"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="addressCity" className="block text-sm font-medium text-gray-700">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          name="city"
                          id="addressCity"
                          value={editingAddress ? editAddressData.city : newAddress.city}
                          onChange={editingAddress ? handleEditAddressChange : handleAddressChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="addressState" className="block text-sm font-medium text-gray-700">
                          Estado/Provincia
                        </label>
                        <input
                          type="text"
                          name="state"
                          id="addressState"
                          value={editingAddress ? editAddressData.state : newAddress.state}
                          onChange={editingAddress ? handleEditAddressChange : handleAddressChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="addressZipCode" className="block text-sm font-medium text-gray-700">
                          Código Postal
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          id="addressZipCode"
                          value={editingAddress ? editAddressData.zipCode : newAddress.zipCode}
                          onChange={editingAddress ? handleEditAddressChange : handleAddressChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="addressCountry" className="block text-sm font-medium text-gray-700">
                          País
                        </label>
                        <input
                          type="text"
                          name="country"
                          id="addressCountry"
                          value={editingAddress ? editAddressData.country : newAddress.country}
                          onChange={editingAddress ? handleEditAddressChange : handleAddressChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          id="addressIsDefault"
                          name="isDefault"
                          type="checkbox"
                          checked={editingAddress ? editAddressData.isDefault : newAddress.isDefault}
                          onChange={(e) => 
                            editingAddress 
                              ? setEditAddressData(prev => ({...prev, isDefault: e.target.checked}))
                              : setNewAddress(prev => ({...prev, isDefault: e.target.checked}))
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="addressIsDefault" className="ml-2 block text-sm text-gray-900">
                          Establecer como dirección predeterminada
                        </label>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex space-x-3">
                      <button
                        type="submit"
                        disabled={addressSaving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {addressSaving ? 'Guardando...' : (editingAddress ? 'Guardar Cambios' : 'Agregar Dirección')}
                      </button>
                      
                      {editingAddress && (
                        <button
                          type="button"
                          onClick={cancelEditingAddress}
                          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                
                {/* Saved Addresses */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Direcciones Guardadas</h2>
                  {addresses.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay direcciones</h3>
                      <p className="mt-1 text-sm text-gray-500">Agrega tu primera dirección usando el formulario de arriba.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{address.name}</h3>
                              <p className="text-sm text-gray-500">{address.street}</p>
                              <p className="text-sm text-gray-500">{address.city}, {address.state} {address.zipCode}</p>
                              <p className="text-sm text-gray-500">{address.country}</p>
                              {address.isDefault && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-2">
                                  Predeterminada
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => startEditingAddress(address)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleSetDefaultAddress(address.id)}
                                disabled={address.isDefault}
                                className={`inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 ${address.isDefault ? 'bg-gray-100' : 'bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200'}`}
                              >
                                {address.isDefault ? 'Predeterminada' : 'Hacer Predeterminada'}
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(address.id)}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;