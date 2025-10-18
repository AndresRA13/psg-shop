import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

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
import { getSalesData, getSalesByCategory, getOrderStatusDistribution, getTopSellingProducts, getUserRegistrationData, getRevenueByPaymentMethod } from '../../services/analyticsService';
import CouponManager from '../../components/CouponManager';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import StarRating from '../../components/StarRating';
// Add chart components imports
import SalesTrendChart from '../../components/charts/SalesTrendChart';
import SalesByCategoryChart from '../../components/charts/SalesByCategoryChart';
import OrderStatusChart from '../../components/charts/OrderStatusChart';
import PaymentMethodChart from '../../components/charts/PaymentMethodChart';
import UserRegistrationChart from '../../components/charts/UserRegistrationChart';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiHome, FiShoppingBag, FiUsers, FiMessageSquare, FiTag, FiPackage, FiBarChart2, FiPlus, FiEdit, FiTrash2, FiLogOut, FiShoppingCart, FiSun, FiMoon } from 'react-icons/fi';

const ModernAdminDashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('analytics');
  const [theme, setTheme] = useState('light');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalReviews: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentUsers: [],
    // Analytics data
    salesData: [],
    salesByCategory: [],
    orderStatusData: [],
    topSellingProducts: [],
    userRegistrationData: [],
    paymentMethodData: [],
    dateRange: 'last30days' // Default date range
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
  
  // Search state for products
  const [productSearchTerm, setProductSearchTerm] = useState('');
  
  // Admin profile menu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  
  // UI state
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('adminDashboardTheme', newTheme);
  };

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('adminDashboardTheme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (stats.dateRange) {
        case 'last7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'last90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'lastYear':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
      
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
      
      // Fetch analytics data
      const salesData = await getSalesData(startDate, endDate);
      const salesByCategory = await getSalesByCategory();
      const orderStatusData = await getOrderStatusDistribution();
      const topSellingProducts = await getTopSellingProducts(10);
      const userRegistrationData = await getUserRegistrationData(startDate, endDate);
      const paymentMethodData = await getRevenueByPaymentMethod();
      
      setStats({
        totalProducts: productsCount,
        totalOrders: ordersCount,
        totalUsers: usersCount,
        totalReviews: reviewsCount,
        totalRevenue: totalRevenue,
        recentOrders,
        recentUsers,
        salesData: salesData.salesData,
        salesByCategory,
        orderStatusData,
        topSellingProducts,
        userRegistrationData: userRegistrationData.registrationData,
        paymentMethodData,
        dateRange: stats.dateRange
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Error al cargar las estadísticas del dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (range) => {
    setStats(prev => ({
      ...prev,
      dateRange: range
    }));
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

  // Filter products based on search term
  const filteredProducts = productSearchTerm
    ? products.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(productSearchTerm.toLowerCase()))
      )
    : products;

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
          <div className="w-full space-y-6">
            {/* Date Range Selector */}
            <div className={`flex flex-wrap items-center justify-between gap-4 p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Analíticas</h2>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleDateRangeChange('last7days')}
                  className={`px-4 py-2 text-sm rounded-lg ${
                    stats.dateRange === 'last7days' 
                      ? 'bg-blue-600 text-white' 
                      : theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Últimos 7 días
                </button>
                <button 
                  onClick={() => handleDateRangeChange('last30days')}
                  className={`px-4 py-2 text-sm rounded-lg ${
                    stats.dateRange === 'last30days' 
                      ? 'bg-blue-600 text-white' 
                      : theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Últimos 30 días
                </button>
                <button 
                  onClick={() => handleDateRangeChange('last90days')}
                  className={`px-4 py-2 text-sm rounded-lg ${
                    stats.dateRange === 'last90days' 
                      ? 'bg-blue-600 text-white' 
                      : theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Últimos 90 días
                </button>
                <button 
                  onClick={() => handleDateRangeChange('lastYear')}
                  className={`px-4 py-2 text-sm rounded-lg ${
                    stats.dateRange === 'lastYear' 
                      ? 'bg-blue-600 text-white' 
                      : theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Último año
                </button>
              </div>
            </div>
            
            {/* Key Metrics */}
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900' : 'bg-blue-100'}`}>
                    <FiShoppingBag className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} size={24} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Productos</p>
                    <p className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalProducts}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-green-900' : 'bg-green-100'}`}>
                    <FiPackage className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} size={24} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Pedidos</p>
                    <p className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalOrders}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-purple-900' : 'bg-purple-100'}`}>
                    <FiUsers className={`${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} size={24} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Usuarios</p>
                    <p className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
                    <FiBarChart2 className={`${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} size={24} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Ingresos Totales</p>
                    <p className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Charts Section */}
            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Sales Trend Chart */}
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
                <h3 className={`mb-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tendencia de Ventas</h3>
                <div className="w-full h-80">
                  <SalesTrendChart data={stats.salesData} theme={theme} />
                </div>
              </div>
              
              {/* Sales by Category Chart */}
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
                <h3 className={`mb-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ventas por Categoría</h3>
                <div className="w-full h-80">
                  <SalesByCategoryChart data={stats.salesByCategory} theme={theme} />
                </div>
              </div>
              
              {/* Order Status Distribution */}
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
                <h3 className={`mb-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Distribución de Estados de Pedido</h3>
                <div className="w-full h-80">
                  <OrderStatusChart data={stats.orderStatusData} theme={theme} />
                </div>
              </div>
              
              {/* Revenue by Payment Method */}
              <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
                <h3 className={`mb-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ingresos por Método de Pago</h3>
                <div className="w-full h-80">
                  <PaymentMethodChart data={stats.paymentMethodData} theme={theme} />
                </div>
              </div>
            </div>
            
            {/* Top Selling Products */}
            <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
              <h3 className={`mb-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Productos Más Vendidos</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Producto</th>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Cantidad Vendida</th>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                    {stats.topSellingProducts.map((product, index) => (
                      <tr key={index} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.productName}</td>
                        <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{product.quantity}</td>
                        <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(product.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* User Registration Trend */}
            <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
              <h3 className={`mb-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Tendencia de Registro de Usuarios</h3>
              <div className="w-full h-80">
                <UserRegistrationChart data={stats.userRegistrationData} theme={theme} />
              </div>
            </div>
            
            {/* Recent Orders */}
            <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
              <h3 className={`mb-4 text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pedidos Recientes</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>ID</th>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Cliente</th>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Fecha</th>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Total</th>
                      <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Estado</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{order.id.substring(0, 8)}...</td>
                        <td className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.userEmail || 'N/A'}</td>
                        <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatDate(order.createdAt)}</td>
                        <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(order.totalAmount || 0)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap`}>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.orderStatus || 'pending', theme)}`}>
                            {getOrderStatusText(order.orderStatus || 'pending')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'products':
        // Filter products based on search term
        const filteredProducts = productSearchTerm
          ? products.filter(product =>
              product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
              (product.category && product.category.toLowerCase().includes(productSearchTerm.toLowerCase())) ||
              (product.description && product.description.toLowerCase().includes(productSearchTerm.toLowerCase()))
            )
          : products;

        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todos los productos</h2>
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  <FiShoppingBag className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                <button 
                  onClick={openAddProductModal} 
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-full ${
                    theme === 'dark' 
                      ? 'text-gray-200 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <FiPlus className="mr-1" />
                  Añadir Nuevo
                </button>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Nombre</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Precio</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Stock</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.name}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(product.price)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{product.stock}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => openEditProductModal(product)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id, product.name)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {productSearchTerm ? 'No se encontraron productos que coincidan con la búsqueda.' : 'No hay productos disponibles.'}
                </div>
              )}
            </div>
          </div>
        );
      case 'users':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todos los usuarios</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Email</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Nombre</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Rol</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {users.map((user) => (
                    <tr key={user.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.email}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{user.name || 'N/A'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{user.role}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')} 
                          className={`px-3 py-1 text-xs rounded-md ${
                            user.role === 'admin' 
                              ? (theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800') 
                              : (theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800')
                          } hover:opacity-80`}
                        >
                          {user.role === 'admin' ? 'Usuario' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todas las reseñas</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Usuario</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Producto</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Calificación</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Comentario</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Fecha</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {reviews.map((review) => (
                    <tr key={review.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{review.userEmail || 'Usuario eliminado'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{review.productName || 'Producto eliminado'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{review.rating}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{review.comment}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatDate(review.createdAt)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => openEditReviewModal(review)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => deleteReviewHandler(review.id)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todos los pedidos</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>ID</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Cliente</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Fecha</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Total</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Estado</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {orders.map((order) => (
                    <tr key={order.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.id.substring(0, 8)}...</td>
                      <td className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.userEmail || 'N/A'}</td>
                      <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatDate(order.createdAt)}</td>
                      <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(order.totalAmount || 0)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.orderStatus || 'pending', theme)}`}>
                          {getOrderStatusText(order.orderStatus || 'pending')}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => openOrderDetails(order)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          <FiShoppingCart />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'coupons':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todos los códigos promocionales</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <CouponManager />
            </div>
          </div>
        );
      default:
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Producto</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Cliente</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Calificación</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Comentario</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {reviews.map((review) => (
                    <tr key={review.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{review.productName}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{review.userEmail}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        <StarRating rating={review.rating} />
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{review.comment}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => openEditReviewModal(review)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => deleteReviewHandler(review.id)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todos los pedidos</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>ID</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Cliente</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Fecha</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Total</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Estado</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {orders.map((order) => (
                    <tr key={order.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{order.id.substring(0, 8)}...</td>
                      <td className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.userEmail || 'N/A'}</td>
                      <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatDate(order.createdAt)}</td>
                      <td className={`px-6 py-4 text-sm whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(order.totalAmount || 0)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.orderStatus || 'pending', theme)}`}>
                          {getOrderStatusText(order.orderStatus || 'pending')}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => openOrderDetails(order)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          <FiPackage />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'reviews':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todas las reseñas</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Producto</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Usuario</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Calificación</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Comentario</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {reviews.map((review) => (
                    <tr key={review.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{review.productName}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{review.userEmail || 'N/A'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                        <StarRating rating={review.rating} />
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{review.comment}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => openEditReviewModal(review)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => deleteReviewHandler(review.id)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                          }`}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Todos los pedidos</h2>
            </div>
            <div className="w-full overflow-x-auto">
              <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                <thead>
                  <tr>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>ID</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Cliente</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Fecha</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Total</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Estado</th>
                    <th className={`px-6 py-3 text-xs font-medium tracking-wider text-left uppercase ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                  {orders.map((order) => (
                    <tr key={order.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.id.substring(0, 8)}...</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{order.userEmail || 'N/A'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatDate(order.createdAt)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>{formatCurrency(order.totalAmount || 0)}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm`}>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.orderStatus, theme)}`}>
                            {getOrderStatusText(order.orderStatus)}
                          </span>
                          {orderStatusUpdating[order.id] ? (
                            <div className={`w-4 h-4 border-b-2 rounded-full animate-spin ${
                              theme === 'dark' ? 'border-gray-400' : 'border-gray-900'
                            }`}></div>
                          ) : (
                            <select
                              value={order.orderStatus || 'pending'}
                              onChange={(e) => updateOrderStatusHandler(order.id, e.target.value)}
                              className={`text-xs rounded px-2 py-1 ${
                                theme === 'dark' 
                                  ? 'bg-gray-700 border-gray-600 text-white' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                              <option value="pending">Pendiente</option>
                              <option value="processing">Procesando</option>
                              <option value="shipped">Enviado</option>
                              <option value="delivered">Entregado</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-md font-medium flex space-x-2`}>
                        <button 
                          onClick={() => openOrderDetails(order)} 
                          className={`p-1 rounded hover:opacity-80 ${
                            theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-indigo-600 hover:text-indigo-900'
                          }`}
                        >
                          <FiShoppingBag />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'coupons':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <h2 className={`mb-6 text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Gestión de Cupones</h2>
const Dashboard = ({ theme, activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'coupons':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
  const renderContent = () => {
    switch (currentTab) {
      case 'coupons':
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-8800' : 'bg-white'} w-full`}>
            <CouponManager theme={theme} />
          </div>
        );
      default:
        return (
          <div className={`p-6 shadow-sm rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} w-full`}>
            <h2 className={`mb-6 text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h2>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Bienvenido al panel de administración moderno.</p>
          </div>
        );
    }
  };
  };
  };

  return (
    <div className={`min-h-screen flex w-full ${theme === 'dark' ? 'dark:bg-gray-900 bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="fixed z-50 px-6 py-4 text-white bg-green-600 rounded-lg shadow-lg top-4 right-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="fixed z-50 px-6 py-4 text-white bg-red-600 rounded-lg shadow-lg top-4 right-4">
          {error}
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? 'dark:bg-gray-800 bg-gray-800' : ''}`}
      >
        <div className={`flex items-center justify-between p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Admin Panel</h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className={`p-1 rounded-lg lg:hidden ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <FiX size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeSection === item.id
                      ? theme === 'dark' 
                        ? 'bg-blue-900 text-blue-300' 
                        : 'bg-blue-100 text-blue-600'
                      : theme === 'dark' 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full">
        {/* Header */}
        <header className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex-wrap gap-4`}>
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)}
              className={`p-2 mr-4 rounded-lg lg:hidden ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              <FiMenu size={24} />
            </button>
            <h2 className={`text-xl font-semibold capitalize ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                theme === 'dark' 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            
            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className={`flex items-center justify-center w-10 h-10 text-white rounded-full ${
                  theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              </button>
              
              {isProfileMenuOpen && (
                <div className={`absolute right-0 z-50 w-48 mt-2 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="py-1">
                    <div className={`px-4 py-2 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {currentUser?.email}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Administrador
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className={`flex items-center w-full px-4 py-2 text-sm text-left ${
                        theme === 'dark' 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FiLogOut className="mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 w-full p-6 overflow-auto">
          {isAdmin ? (
            renderContent()
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                No tienes permisos para acceder al panel de administración.
              </p>
              <button
                onClick={() => navigate('/')}
                className={`px-4 py-2 mt-4 rounded-lg ${
                  theme === 'dark' 
                    ? 'text-white bg-blue-600 hover:bg-blue-700' 
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Volver al inicio
              </button>
            </div>
          )}
        </main>
      </div>
      
      {/* Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50" 
              aria-hidden="true"
              onClick={() => setProductModalOpen(false)}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* Modern Modal Design */}
            <div className={`z-50 inline-block overflow-hidden text-left align-bottom transition-all transform shadow-xl rounded-2xl sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`} style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '650px' }}>
              <div className="px-8 py-8">
                <div className="mb-8 text-center">
                  <h3 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {modalMode === 'add' ? 'Añadir Producto' : 'Editar Producto'}
                  </h3>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {modalMode === 'add' ? 'Ingresa los detalles del nuevo producto' : 'Modifica la información del producto'}
                  </p>
                </div>
                
                <div className="mt-2">
                  <form onSubmit={modalMode === 'add' ? createProduct : updateProduct} className="space-y-6">
                    <div>
                      <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nombre del Producto</label>
                      <input
                        type="text"
                        name="name"
                        value={modalMode === 'add' ? newProduct.name : editingProduct?.name}
                        onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                        className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Descripción</label>
                      <textarea
                        name="description"
                        value={modalMode === 'add' ? newProduct.description : editingProduct?.description}
                        onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                        className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        rows="4"
                        placeholder="Descripción del producto"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Precio (COP)</label>
                        <input
                          type="number"
                          name="price"
                          step="0.01"
                          min="0"
                          value={modalMode === 'add' ? newProduct.price : editingProduct?.price}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Stock</label>
                        <input
                          type="number"
                          name="stock"
                          min="0"
                          value={modalMode === 'add' ? newProduct.stock : editingProduct?.stock}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Cantidad disponible"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Calificación</label>
                        <input
                          type="number"
                          name="rating"
                          step="0.1"
                          min="0"
                          max="5"
                          value={modalMode === 'add' ? newProduct.rating : editingProduct?.rating}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="0.0 - 5.0"
                        />
                      </div>
                      
                      <div>
                        <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Material</label>
                        <input
                          type="text"
                          name="material"
                          value={modalMode === 'add' ? newProduct.material : editingProduct?.material}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Material del producto"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      <div>
                        <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Color</label>
                        <input
                          type="text"
                          name="color"
                          value={modalMode === 'add' ? newProduct.color : editingProduct?.color}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Color del producto"
                        />
                      </div>
                      
                      <div>
                        <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tamaño</label>
                        <input
                          type="text"
                          name="size"
                          value={modalMode === 'add' ? newProduct.size : editingProduct?.size}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Tamaño del producto"
                        />
                      </div>
                      
                      <div>
                        <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Estilo</label>
                        <input
                          type="text"
                          name="style"
                          value={modalMode === 'add' ? newProduct.style : editingProduct?.style}
                          onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                          className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder="Estilo del producto"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Categoría</label>
                      <select
                        name="category"
                        value={modalMode === 'add' ? newProduct.category : editingProduct?.category}
                        onChange={modalMode === 'add' ? handleProductChange : handleEditProductChange}
                        className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          Seleccionar categoría
                        </option>
                        <option value="Moños Elegantes" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          Moños Elegantes
                        </option>
                        <option value="Moños Infantiles" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          Moños Infantiles
                        </option>
                        <option value="Moños Deportivos" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          Moños Deportivos
                        </option>
                        <option value="Moños Casuales" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          Moños Casuales
                        </option>
                        <option value="Moños de Novia" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          Moños de Novia
                        </option>
                        <option value="Moños de Gala" className={theme === 'dark' ? 'bg-gray-700' : 'bg-white'}>
                          Moños de Gala
                        </option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Imágenes</label>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleImageSelect(modalMode === 'edit')}
                          className={`inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                            theme === 'dark' 
                              ? 'text-gray-200 bg-gray-700 border border-gray-600 hover:bg-gray-600' 
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                          disabled={uploading || (modalMode === 'add' ? newProduct.imageUrls.length >= 4 : editingProduct?.imageUrls.length >= 4)}
                        >
                          {uploading ? 'Subiendo...' : `Añadir Imagen${modalMode === 'add' ? (newProduct.imageUrls.length > 0 ? ` (${newProduct.imageUrls.length}/4)` : '') : (editingProduct?.imageUrls.length > 0 ? ` (${editingProduct?.imageUrls.length}/4)` : '')}`}
                        </button>
                        
                        {(modalMode === 'add' ? newProduct.imageUrls.length >= 4 : editingProduct?.imageUrls.length >= 4) && (
                          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Has alcanzado el límite máximo de 4 imágenes.</p>
                        )}
                        
                        {uploading && (
                          <div className="mt-4">
                            <div className={`w-8 h-8 border-b-2 rounded-full animate-spin ${
                              theme === 'dark' ? 'border-gray-400' : 'border-gray-900'
                            }`}></div>
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
                                        ? theme === 'dark' 
                                          ? 'bg-blue-600 text-white' 
                                          : 'bg-gray-900 text-white' 
                                        : theme === 'dark' 
                                          ? 'bg-gray-700 text-gray-200 border border-gray-600' 
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
                                        ? theme === 'dark' 
                                          ? 'bg-blue-600 text-white' 
                                          : 'bg-gray-900 text-white' 
                                        : theme === 'dark' 
                                          ? 'bg-gray-700 text-gray-200 border border-gray-600' 
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

                    <div className={`flex justify-between px-8 py-5 border-t ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setProductModalOpen(false)}
                        className={`inline-flex justify-center px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                          theme === 'dark' 
                            ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600' 
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`inline-flex justify-center px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all ${
                          theme === 'dark' 
                            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        } border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        {modalMode === 'add' ? 'Añadir Producto' : 'Actualizar Producto'}
                      </button>
                    </div>
                  </form>
                </div>
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
              className="fixed inset-0 transition-opacity bg-black bg-opacity-50" 
              aria-hidden="true"
              onClick={() => setReviewModalOpen(false)}
            ></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            {/* Modern Modal Design */}
            <div className={`z-50 inline-block overflow-hidden text-left align-bottom transition-all transform shadow-xl rounded-2xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`} style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '650px' }}>
              <div className="px-8 py-8">
                <div className="mb-8 text-center">
                  <h3 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Editar Reseña
                  </h3>
                  <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Modifica la calificación y el comentario de la reseña
                  </p>
                </div>
                
                <div className="mt-2">
                  <form onSubmit={saveEditedReview} className="space-y-6">
                    <div>
                      <label className={`block mb-4 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Calificación</label>
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
                              <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}>☆</span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3 text-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {editingReview.rating} de 5 estrellas
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block mb-3 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Comentario
                      </label>
                      <textarea
                        name="comment"
                        rows={6}
                        value={editingReview.comment}
                        onChange={handleReviewEditChange}
                        className={`w-full px-4 py-3 transition-all border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                        placeholder="Escribe tu reseña aquí..."
                      />
                    </div>
                    
                    <div className={`flex justify-between px-8 py-5 border-t ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setReviewModalOpen(false)}
                        className={`inline-flex justify-center px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                          theme === 'dark' 
                            ? 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600' 
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`inline-flex justify-center px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all ${
                          theme === 'dark' 
                            ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        } border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
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
          theme={theme}
        />
      )}
    </div>
  );
};

export default ModernAdminDashboard;