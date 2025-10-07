import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../App';
import { db, storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { getAllUsers, updateUserRole as updateUserServiceRole } from '../../services/userService';
import { getAllReviews, deleteReview, updateReview } from '../../services/reviewService';
import { getAllOrders, updateOrderStatus, getOrderStatusText, getStatusBadgeClass } from '../../services/orderService';
import CouponManager from '../../components/CouponManager';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import StarRating from '../../components/StarRating';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiShoppingBag, FiUsers, FiMessageSquare, FiTag, FiPackage, FiBarChart2, FiPlus, FiEdit, FiTrash2, FiLogOut, FiShoppingCart } from 'react-icons/fi';

const ModernAdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('analytics');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentUsers: []
  });
  const [loading, setLoading] = useState(false);
  
  // Products state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    imageUrls: [],
    primaryImageIndex: 0,
    category: '',
    material: '',
    color: '',
    size: '',
    style: '',
    stock: 0,
    rating: 0
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  
  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderStatusUpdating, setOrderStatusUpdating] = useState({});
  
  // Admin profile menu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  
  // UI state
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle profile menu
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  // Close profile menu
  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      closeProfileMenu();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Error al cerrar sesión');
    }
  };

  // Show success message
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
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

  // Update order status
  const updateOrderStatusHandler = async (orderId, newStatus) => {
    try {
      setOrderStatusUpdating(prev => ({ ...prev, [orderId]: true }));
      
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, orderStatus: newStatus, updatedAt: new Date() }
          : order
      ));
      
      // Also update selectedOrder if it's the same order
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus, updatedAt: new Date() });
      }
      
      showSuccessMessage(`Estado del pedido actualizado a ${getOrderStatusText(newStatus)}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("Error al actualizar el estado del pedido");
    } finally {
      setOrderStatusUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch products count
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsCount = productsSnapshot.size;
      
      // Fetch orders count and calculate total revenue
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const ordersCount = ordersSnapshot.size;
      
      // Calculate total revenue
      let totalRevenue = 0;
      ordersSnapshot.docs.forEach(doc => {
        const orderData = doc.data();
        totalRevenue += orderData.totalAmount || 0;
      });
      
      // Fetch users count
      const usersList = await getAllUsers();
      const usersCount = usersList.length;
      
      // Fetch reviews count
      const reviewsList = await getAllReviews();
      const reviewsCount = reviewsList.length;
      
      // Fetch recent orders (last 5)
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
      const ordersData = await getDocs(ordersQuery);
      const recentOrders = ordersData.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch recent users (last 5)
      const recentUsers = usersList.slice(0, 5);
      
      setStats({
        totalProducts: productsCount,
        totalOrders: ordersCount,
        totalUsers: usersCount,
        totalReviews: reviewsCount,
        totalRevenue: totalRevenue,
        recentOrders,
        recentUsers
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Error al cargar las estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Error al cargar los productos');
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Error al cargar los usuarios');
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const reviewsList = await getAllReviews();
      setReviews(reviewsList);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Error al cargar las reseñas');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const ordersList = await getAllOrders();
      setOrders(ordersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Error al cargar los pedidos');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Initialize data based on active section
  useEffect(() => {
    if (isAdmin) {
      // Reset loading states when switching sections
      setLoading(false); // Only used for analytics
      setProductsLoading(false);
      setUsersLoading(false);
      setReviewsLoading(false);
      setOrdersLoading(false);
      
      switch (activeSection) {
        case 'analytics':
          fetchDashboardStats();
          break;
        case 'products':
          setProductsLoading(true);
          fetchProducts();
          break;
        case 'users':
          setUsersLoading(true);
          fetchUsers();
          break;
        case 'reviews':
          setReviewsLoading(true);
          fetchReviews();
          break;
        case 'orders':
          setOrdersLoading(true);
          fetchOrders();
          break;
        default:
          fetchDashboardStats();
      }
    }
  }, [activeSection, isAdmin]);

  // Handle product form changes
  const handleProductChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  // Handle edit product form changes
  const handleEditProductChange = (e) => {
    setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
  };

  // Handle file upload - Modified to use base64 encoding instead of Firebase Storage
  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError("Por favor, sube una imagen válida (JPEG, JPG, PNG, GIF).");
      return null;
    }
    
    // Validate file size (max 1MB to avoid Firestore limits)
    if (file.size > 1024 * 1024) {
      setError("La imagen debe ser menor a 1MB.");
      return null;
    }
    
    try {
      setUploading(true);
      // Convert file to base64
      const base64Data = await fileToBase64(file);
      return {
        name: file.name,
        type: file.type,
        data: base64Data,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error("Error converting file to base64:", error);
      setError("Error al procesar la imagen: " + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle image selection - Modified to support multiple images with limit of 4 and base64 encoding
  const handleImageSelect = async (isEditing = false) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true; // Allow multiple file selection
    
    fileInput.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      
      // Check if we're adding or editing
      const currentImages = isEditing ? editingProduct.imageUrls : newProduct.imageUrls;
      
      // Check if adding these files would exceed the limit of 4 images
      if (currentImages.length + files.length > 4) {
        setError(`Solo puedes subir un máximo de 4 imágenes. Actualmente tienes ${currentImages.length} imágenes.`);
        return;
      }
      
      // Process each file
      const imageDataArray = [];
      for (const file of files) {
        const imageData = await handleFileUpload(file);
        if (imageData) {
          imageDataArray.push(imageData);
        }
      }
      
      // Update state with new images
      if (imageDataArray.length > 0) {
        if (isEditing) {
          setEditingProduct({
            ...editingProduct,
            imageUrls: [...editingProduct.imageUrls, ...imageDataArray]
          });
        } else {
          setNewProduct({
            ...newProduct,
            imageUrls: [...newProduct.imageUrls, ...imageDataArray]
          });
        }
        showSuccessMessage(`${imageDataArray.length} imagen(es) subida(s) exitosamente!`);
      }
    };
    
    fileInput.click();
  };

  // Remove image
  const removeImage = (index, isEditing = false) => {
    if (isEditing) {
      const newImages = [...editingProduct.imageUrls];
      newImages.splice(index, 1);
      setEditingProduct({
        ...editingProduct,
        imageUrls: newImages
      });
    } else {
      const newImages = [...newProduct.imageUrls];
      newImages.splice(index, 1);
      setNewProduct({
        ...newProduct,
        imageUrls: newImages
      });
    }
  };

  // Set primary image
  const setPrimaryImage = (index, isEditing = false) => {
    if (isEditing) {
      setEditingProduct({
        ...editingProduct,
        primaryImageIndex: index
      });
    } else {
      setNewProduct({
        ...newProduct,
        primaryImageIndex: index
      });
    }
  };

  // Create product
  const createProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      setError("Por favor, introduce al menos un nombre y un precio.");
      return;
    }
    
    try {
      // Validate price is a number
      const price = parseFloat(newProduct.price);
      if (isNaN(price)) {
        setError("El precio debe ser un número válido.");
        return;
      }
      
      // Validate stock is a number
      const stock = parseInt(newProduct.stock);
      if (isNaN(stock)) {
        setError("El stock debe ser un número válido.");
        return;
      }
      
      // Validate rating is a number between 0 and 5
      const rating = parseFloat(newProduct.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        setError("La calificación debe ser un número entre 0 y 5.");
        return;
      }
      
      await addDoc(collection(db, "products"), { 
        ...newProduct,
        price: price,
        stock: stock,
        rating: rating,
        createdAt: new Date()
      });
      
      setNewProduct({ 
        name: '', 
        description: '', 
        price: '',
        stock: 0,
        rating: 0,
        imageUrls: [],
        primaryImageIndex: 0,
        category: '',
        material: '',
        color: '',
        size: '',
        style: ''
      });
      
      showSuccessMessage("Producto añadido exitosamente!");
      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Firebase error: ", err);
      setError("Error al crear el producto. ¿Tienes permisos de escritura?");
    }
  };

  // Update product
  const updateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) {
      setError("Por favor, introduce al menos un nombre y un precio.");
      return;
    }
    
    try {
      // Validate price is a number
      const price = parseFloat(editingProduct.price);
      if (isNaN(price)) {
        setError("El precio debe ser un número válido.");
        return;
      }
      
      // Validate stock is a number
      const stock = parseInt(editingProduct.stock);
      if (isNaN(stock)) {
        setError("El stock debe ser un número válido.");
        return;
      }
      
      // Validate rating is a number between 0 and 5
      const rating = parseFloat(editingProduct.rating);
      if (isNaN(rating) || rating < 0 || rating > 5) {
        setError("La calificación debe ser un número entre 0 y 5.");
        return;
      }
      
      const productDoc = doc(db, "products", editingProduct.id);
      await updateDoc(productDoc, {
        ...editingProduct,
        price: price,
        stock: stock,
        rating: rating,
        updatedAt: new Date()
      });
      
      showSuccessMessage("Producto actualizado exitosamente!");
      setProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("Firebase error: ", err);
      setError("Error al actualizar el producto. ¿Tienes permisos de escritura?");
    }
  };

  // Delete product
  const deleteProduct = async (id, name) => {
    const confirmDelete = window.confirm(`¿Estás seguro de que quieres eliminar el producto "${name}"?`);
    if (!confirmDelete) return;

    try {
      const productDoc = doc(db, "products", id);
      await deleteDoc(productDoc);
      setProducts(products.filter((product) => product.id !== id));
      showSuccessMessage("Producto eliminado exitosamente!");
    } catch (err) {
      console.error("Firebase error: ", err);
      setError("Error al eliminar el producto. ¿Tienes permisos de escritura?");
    }
  };

  // Open add product modal
  const openAddProductModal = () => {
    setNewProduct({ 
      name: '', 
      description: '', 
      price: '', 
      imageUrls: [],
      primaryImageIndex: 0,
      category: '',
      material: '',
      color: '',
      size: '',
      style: '',
      stock: 0,
      rating: 0
    });
    setModalMode('add');
    setProductModalOpen(true);
  };

  // Open edit product modal
  const openEditProductModal = (product) => {
    setEditingProduct({ ...product });
    setModalMode('edit');
    setProductModalOpen(true);
  };

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      await updateUserServiceRole(userId, newRole);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, updatedAt: new Date() }
          : user
      ));
      
      showSuccessMessage(`Usuario actualizado a ${newRole === 'admin' ? 'administrador' : 'cliente'} exitosamente!`);
    } catch (err) {
      console.error("Firebase error updating user role: ", err);
      setError("Error al actualizar el rol del usuario. ¿Tienes permisos de escritura?");
    }
  };

  // Handle review edit change
  const handleReviewEditChange = (e) => {
    const { name, value } = e.target;
    setEditingReview({ ...editingReview, [name]: value });
  };

  // Handle star rating click for editing
  const handleEditRatingClick = (rating) => {
    setEditingReview({ ...editingReview, rating });
  };

  // Save edited review
  const saveEditedReview = async (e) => {
    e.preventDefault();
    
    // Validate rating
    if (editingReview.rating < 1 || editingReview.rating > 5) {
      setError("La calificación debe estar entre 1 y 5 estrellas.");
      return;
    }
    
    // Validate comment
    if (!editingReview.comment || editingReview.comment.trim() === '') {
      setError("El comentario no puede estar vacío.");
      return;
    }
    
    try {
      await updateReview(editingReview.id, {
        rating: editingReview.rating,
        comment: editingReview.comment.trim()
      });
      
      // Update local state
      setReviews(reviews.map(review => 
        review.id === editingReview.id 
          ? { ...review, rating: editingReview.rating, comment: editingReview.comment.trim() }
          : review
      ));
      
      setEditingReview(null);
      setReviewModalOpen(false);
      showSuccessMessage("Reseña actualizada exitosamente!");
    } catch (err) {
      console.error("Firebase error: ", err);
      setError("Error al actualizar la reseña. ¿Tienes permisos de escritura?");
    }
  };

  // Delete review
  const deleteReviewHandler = async (id) => {
    const confirmDelete = window.confirm("¿Estás seguro de que quieres eliminar esta reseña?");
    if (!confirmDelete) return;

    try {
      await deleteReview(id);
      setReviews(reviews.filter((review) => review.id !== id));
      showSuccessMessage("Reseña eliminada exitosamente!");
    } catch (err) {
      console.error("Firebase error: ", err);
      setError("Error al eliminar la reseña. ¿Tienes permisos de escritura?");
    }
  };

  // Open edit review modal
  const openEditReviewModal = (review) => {
    setEditingReview({ ...review });
    setReviewModalOpen(true);
  };

  // Open order details modal
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
  };

  // Close order details modal
  const closeOrderDetails = () => {
    setOrderModalOpen(false);
    setSelectedOrder(null);
  };

  // Navigation items
  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: <FiBarChart2 /> },
    { id: 'products', label: 'Productos', icon: <FiShoppingBag /> },
    { id: 'users', label: 'Usuarios', icon: <FiUsers /> },
    { id: 'reviews', label: 'Reviews', icon: <FiMessageSquare /> },
    { id: 'coupons', label: 'Códigos Promocionales', icon: <FiTag /> },
    { id: 'orders', label: 'Pedidos', icon: <FiPackage /> },
  ];

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'analytics':
        return (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Stats Cards */}
            <div className="p-6 bg-white shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiShoppingBag className="text-blue-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Productos</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FiPackage className="text-green-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FiUsers className="text-purple-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FiMessageSquare className="text-yellow-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reseñas</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalReviews}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FiBarChart2 className="text-indigo-600" size={24} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="p-6 bg-white shadow-sm rounded-xl md:col-span-2 lg:col-span-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Pedidos Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{order.id.substring(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{order.userEmail || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatCurrency(order.totalAmount || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.orderStatus || 'pending')}`}>
                            {getOrderStatusText(order.orderStatus || 'pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Users */}
            <div className="p-6 bg-white shadow-sm rounded-xl md:col-span-2 lg:col-span-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">Usuarios Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha de Registro</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{user.name || user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'products':
        return (
          <div className="p-6 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Gestión de Productos</h2>
              <button 
                onClick={openAddProductModal}
                className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Añadir Producto
              </button>
            </div>
            
            {productsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Imagen</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nombre</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Precio</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex-shrink-0 w-10 h-10">
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                              <img 
                                className="object-cover w-10 h-10 rounded-md" 
                                src={typeof product.imageUrls[product.primaryImageIndex] === 'string' ? 
                                  product.imageUrls[product.primaryImageIndex] : 
                                  product.imageUrls[product.primaryImageIndex]?.data || 
                                  product.imageUrls[0]} 
                                alt={product.name} 
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/40x40.png?text=Moño';
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-md">
                                <FiShoppingBag className="text-gray-500" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <button 
                            onClick={() => openEditProductModal(product)}
                            className="mr-3 text-blue-600 hover:text-blue-900"
                            title="Editar producto"
                          >
                            <FiEdit />
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar producto"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'users':
        return (
          <div className="p-6 bg-white shadow-sm rounded-xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Gestión de Usuarios</h2>
            
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rol</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <button
                            onClick={() => {
                              const newRole = user.role === 'admin' ? 'customer' : 'admin';
                              updateUserRole(user.id, newRole);
                            }}
                            className={`px-3 py-1 text-xs rounded-md ${
                              user.role === 'admin' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            {user.role === 'admin' ? 'Hacer Cliente' : 'Hacer Administrador'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'reviews':
        return (
          <div className="p-6 bg-white shadow-sm rounded-xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Gestión de Reseñas</h2>
            
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Producto</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Usuario</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Calificación</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <tr key={review.id}>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {review.productId || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{review.userName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{review.userEmail || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StarRating rating={review.rating} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(review.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <button 
                            onClick={() => openEditReviewModal(review)}
                            className="mr-3 text-blue-600 hover:text-blue-900"
                            title="Editar reseña"
                          >
                            <FiEdit />
                          </button>
                          <button 
                            onClick={() => deleteReviewHandler(review.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar reseña"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case 'coupons':
        return (
          <div className="p-6 bg-white shadow-sm rounded-xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Gestión de Códigos Promocionales</h2>
            <CouponManager />
          </div>
        );
      case 'orders':
        return (
          <div className="p-6 bg-white shadow-sm rounded-xl">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Gestión de Pedidos</h2>
            
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cliente</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Estado</th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{order.id.substring(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{order.userEmail || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{formatCurrency(order.totalAmount || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.orderStatus || 'pending'}
                            onChange={(e) => updateOrderStatusHandler(order.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={orderStatusUpdating[order.id]}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="processing">Procesando</option>
                            <option value="shipped">Enviado</option>
                            <option value="delivered">Entregado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <button
                            onClick={() => openOrderDetails(order)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="p-6 bg-white shadow-sm rounded-xl">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Bienvenido al panel de administración moderno.</p>
          </div>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="mt-2 text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <FiShoppingBag className="text-blue-600" size={24} />
            <span className="ml-2 text-xl font-bold text-gray-900">Ecommerce Admin</span>
          </div>
          <button 
            className="p-1 rounded-md lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX size={24} />
          </button>
        </div>
        <nav className="mt-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center w-full px-6 py-3 text-left transition-colors duration-200 ${
                activeSection === item.id
                  ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Admin Header */}
        <header className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 lg:px-6">
          <div className="flex items-center">
            <button 
              className="p-2 mr-2 rounded-md lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Go to Shop Button */}
            
            
            {/* Admin Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <div 
                className="flex items-center px-3 py-1 text-sm bg-gray-100 rounded-full cursor-pointer"
                onClick={toggleProfileMenu}
              >
                <div className="flex items-center justify-center w-8 h-8 mr-2 font-semibold text-white bg-blue-500 rounded-full">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <span className="font-medium text-gray-700">Administrador</span>
              </div>
              
              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 z-50 w-48 mt-2 bg-white rounded-md shadow-lg">
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        navigate('/shop');
                        closeProfileMenu();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiShoppingCart className="mr-3 text-gray-400" />
                      Ir a la tienda
                    </button>
                    <button 
                      onClick={() => {
                        handleLogout();
                        closeProfileMenu();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 text-gray-400" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Success/Error messages */}
        {successMessage && (
          <div className="p-4 mx-4 mt-4 border-l-4 border-green-500 bg-green-50 lg:mx-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-500">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="p-4 mx-4 mt-4 border-l-4 border-red-500 bg-red-50 lg:mx-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500">✕</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 p-4 overflow-y-auto lg:p-6 bg-gray-50">
          {activeSection === 'analytics' && loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-b-2 border-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>

      {/* Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed transition-opacity bg-opacity-75 bg-white-500" 
              aria-hidden="true"
              onClick={() => setProductModalOpen(false)}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* Modern Modal Design */}
            <div className="z-50 inline-block overflow-hidden text-left align-bottom transition-all transform bg-white shadow-xl rounded-2xl sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '650px' }}>
              <div className="px-8 py-8">
                <div className="mb-8 text-center">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {modalMode === 'add' ? 'Añadir Producto' : 'Editar Producto'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {modalMode === 'add' ? 'Ingresa los detalles del nuevo producto' : 'Modifica la información del producto'}
                  </p>
                </div>
                
                <div className="mt-2">
                  <form onSubmit={modalMode === 'add' ? createProduct : updateProduct} className="space-y-6">
                    <div>
                      <label className="block mb-3 text-sm font-medium text-gray-700">Nombre del Producto</label>
                      <input
                        type="text"
                        name="name"
                        value={modalMode === 'add' ? newProduct.name : editingProduct?.name}
                        onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block mb-3 text-sm font-medium text-gray-700">Descripción</label>
                      <textarea
                        name="description"
                        value={modalMode === 'add' ? newProduct.description : editingProduct?.description}
                        onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        rows="4"
                        placeholder="Descripción del producto"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block mb-3 text-sm font-medium text-gray-700">Precio (COP)</label>
                        <input
                          type="number"
                          name="price"
                          step="0.01"
                          min="0"
                          value={modalMode === 'add' ? newProduct.price : editingProduct?.price}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-3 text-sm font-medium text-gray-700">Stock</label>
                        <input
                          type="number"
                          name="stock"
                          min="0"
                          value={modalMode === 'add' ? newProduct.stock : editingProduct?.stock}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="Cantidad disponible"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className="block mb-3 text-sm font-medium text-gray-700">Calificación</label>
                        <input
                          type="number"
                          name="rating"
                          step="0.1"
                          min="0"
                          max="5"
                          value={modalMode === 'add' ? newProduct.rating : editingProduct?.rating}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="0.0 - 5.0"
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-3 text-sm font-medium text-gray-700">Material</label>
                        <input
                          type="text"
                          name="material"
                          value={modalMode === 'add' ? newProduct.material : editingProduct?.material}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="Material del producto"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div>
                        <label className="block mb-3 text-sm font-medium text-gray-700">Color</label>
                        <input
                          type="text"
                          name="color"
                          value={modalMode === 'add' ? newProduct.color : editingProduct?.color}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="Color del producto"
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-3 text-sm font-medium text-gray-700">Tamaño</label>
                        <input
                          type="text"
                          name="size"
                          value={modalMode === 'add' ? newProduct.size : editingProduct?.size}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="Tamaño del producto"
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-3 text-sm font-medium text-gray-700">Estilo</label>
                        <input
                          type="text"
                          name="style"
                          value={modalMode === 'add' ? newProduct.style : editingProduct?.style}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                          placeholder="Estilo del producto"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-3 text-sm font-medium text-gray-700">Categoría</label>
                      <select
                        name="category"
                        value={modalMode === 'add' ? newProduct.category : editingProduct?.category}
                        onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                        className="w-full px-4 py-3 text-gray-900 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                      >
                        <option value="">Seleccionar categoría</option>
                        <option value="Moños Elegantes">Moños Elegantes</option>
                        <option value="Moños Infantiles">Moños Infantiles</option>
                        <option value="Moños Deportivos">Moños Deportivos</option>
                        <option value="Moños Casuales">Moños Casuales</option>
                        <option value="Moños de Novia">Moños de Novia</option>
                        <option value="Moños de Gala">Moños de Gala</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-3 text-sm font-medium text-gray-700">Imágenes</label>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleImageSelect(modalMode === 'edit')}
                          className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                          disabled={uploading || (modalMode === 'add' ? newProduct.imageUrls.length >= 4 : editingProduct?.imageUrls.length >= 4)}
                        >
                          {uploading ? 'Subiendo...' : `Añadir Imagen${modalMode === 'add' ? (newProduct.imageUrls.length > 0 ? ` (${newProduct.imageUrls.length}/4)` : '') : (editingProduct?.imageUrls.length > 0 ? ` (${editingProduct?.imageUrls.length}/4)` : '')}`}
                        </button>
                        
                        {(modalMode === 'add' ? newProduct.imageUrls.length >= 4 : editingProduct?.imageUrls.length >= 4) && (
                          <p className="mt-2 text-sm text-gray-500">Has alcanzado el límite máximo de 4 imágenes.</p>
                        )}
                        
                        {uploading && (
                          <div className="mt-4">
                            <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                          </div>
                        )}
                        
                        {modalMode === 'add' ? (
                          newProduct.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 mt-5">
                              {newProduct.imageUrls.map((imageData, index) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={typeof imageData === 'string' ? imageData : imageData.data} 
                                    alt={`Preview ${index}`} 
                                    className="object-cover w-full h-32 rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/150x150.png?text=Imagen';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-md"
                                  >
                                    <FiX size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPrimaryImage(index)}
                                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs px-2.5 py-1 rounded-full shadow-sm ${
                                      newProduct.primaryImageIndex === index 
                                        ? 'bg-gray-900 text-white' 
                                        : 'bg-white text-gray-800 border border-gray-300'
                                    }`}
                                  >
                                    Principal
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          editingProduct?.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 gap-4 mt-5">
                              {editingProduct.imageUrls.map((imageData, index) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={typeof imageData === 'string' ? imageData : imageData.data} 
                                    alt={`Preview ${index}`} 
                                    className="object-cover w-full h-32 rounded-lg"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/150x150.png?text=Imagen';
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index, true)}
                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-md"
                                  >
                                    <FiX size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPrimaryImage(index, true)}
                                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs px-2.5 py-1 rounded-full shadow-sm ${
                                      editingProduct.primaryImageIndex === index 
                                        ? 'bg-gray-900 text-white' 
                                        : 'bg-white text-gray-800 border border-gray-300'
                                    }`}
                                  >
                                    Principal
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                  </form>
                </div>
              </div>
              
              {/* Action Bar */}
              <div className="flex justify-between px-8 py-5 bg-white border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="inline-flex justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={modalMode === 'add' ? createProduct : updateProduct}
                  className="inline-flex justify-center px-5 py-2.5 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                >
                  {modalMode === 'add' ? 'Añadir Producto' : 'Actualizar Producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Edit Modal */}
      {reviewModalOpen && editingReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed transition-opacity bg-gray-500 bg-opacity-75" 
              aria-hidden="true"
              onClick={() => setReviewModalOpen(false)}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* Modern Modal Design */}
            <div className="z-50 inline-block overflow-hidden text-left align-bottom transition-all transform bg-white shadow-xl rounded-2xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '650px' }}>
              <div className="px-8 py-8">
                <div className="mb-8 text-center">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Editar Reseña
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Modifica la calificación y el comentario de la reseña
                  </p>
                </div>
                
                <div className="mt-2">
                  <form onSubmit={saveEditedReview} className="space-y-6">
                    <div>
                      <label className="block mb-4 text-sm font-medium text-gray-700">Calificación</label>
                      <div className="flex items-center justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleEditRatingClick(star)}
                            className="text-4xl transition-transform focus:outline-none hover:scale-110"
                          >
                            {star <= editingReview.rating ? (
                              <span className="text-yellow-400">★</span>
                            ) : (
                              <span className="text-gray-300">☆</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 text-center">
                        <span className="text-sm text-gray-500">
                          {editingReview.rating} de 5 estrellas
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-3 text-sm font-medium text-gray-700">
                        Comentario
                      </label>
                      <textarea
                        name="comment"
                        rows={6}
                        value={editingReview.comment}
                        onChange={handleReviewEditChange}
                        className="w-full px-4 py-3 text-gray-900 placeholder-gray-400 transition-all border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                        placeholder="Escribe tu reseña aquí..."
                      />
                    </div>
                  </form>
                </div>
              </div>
              
              {/* Action Bar */}
              <div className="flex justify-between px-8 py-5 bg-white border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="inline-flex justify-center px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveEditedReview}
                  className="inline-flex justify-center px-5 py-2.5 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {orderModalOpen && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          isOpen={orderModalOpen}
          onClose={closeOrderDetails}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          getOrderStatusText={getOrderStatusText}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      )}
    </div>
  );
};

export default ModernAdminDashboard;