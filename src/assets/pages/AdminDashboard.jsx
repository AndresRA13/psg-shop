import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from "firebase/firestore";
import { getAllUsers, updateUserRole as updateUserServiceRole } from '../../services/userService';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from '../../App';
import OrderDetailsModal from '../../components/OrderDetailsModal';
import CouponManager from '../../components/CouponManager';
import { getAllReviews, deleteReview, updateReview } from '../../services/reviewService';
import StarRating from '../../components/StarRating';


const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]);
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
    const [editingReview, setEditingReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'orders', 'coupons', or 'reviews'
    const [uploading, setUploading] = useState(false);

    const productsCollectionRef = collection(db, "products");
    const ordersCollectionRef = collection(db, "orders");

    const fetchProducts = async () => {
        try {
            const data = await getDocs(productsCollectionRef);
            setProducts(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        } catch (err) {
            console.error("Firebase error en fetchProducts: ", err);
            setError("No se pudieron cargar los productos. Revisa las reglas de seguridad de Firebase y la consola del navegador.");
        }
        setLoading(false);
    };

    const fetchOrders = async () => {
        try {
            const ordersQuery = query(ordersCollectionRef, orderBy("createdAt", "desc"));
            const data = await getDocs(ordersQuery);
            setOrders(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        } catch (err) {
            console.error("Firebase error en fetchOrders: ", err);
            // Check if it's a missing index error
            if (err.code === 'failed-precondition' || (err.message && err.message.includes('index'))) {
                // Fallback to unordered query and sort in memory
                try {
                    const ordersSnapshot = await getDocs(ordersCollectionRef);
                    const ordersData = ordersSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    // Sort in memory by createdAt (descending)
                    const sortedOrders = ordersData.sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                        return dateB - dateA;
                    });
                    
                    setOrders(sortedOrders);
                } catch (fallbackErr) {
                    console.error("Firebase error fetching orders without index: ", fallbackErr);
                    // Check if it's a permission error
                    if (fallbackErr.code === 'permission-denied') {
                        setError("No tienes permisos para ver las órdenes. Asegúrate de que las reglas de Firestore estén configuradas correctamente.");
                    } else {
                        setError("No se pudieron cargar las órdenes. Revisa las reglas de seguridad de Firebase y la consola del navegador.");
                    }
                }
            } else {
                // Check if it's a permission error
                if (err.code === 'permission-denied') {
                    setError("No tienes permisos para ver las órdenes. Asegúrate de que las reglas de Firestore estén configuradas correctamente.");
                } else {
                    setError("No se pudieron cargar las órdenes. Revisa las reglas de seguridad de Firebase y la consola del navegador.");
                }
            }
        }
        setOrdersLoading(false);
    };

    const fetchReviews = async () => {
        try {
            const reviewsData = await getAllReviews();
            setReviews(reviewsData);
        } catch (err) {
            console.error("Firebase error en fetchReviews: ", err);
            // Check if it's a missing index error
            if (err.code === 'failed-precondition' || (err.message && err.message.includes('index'))) {
                // Fallback to unordered query and sort in memory
                try {
                    const reviewsCollection = collection(db, 'reviews');
                    const reviewSnapshot = await getDocs(reviewsCollection);
                    const reviewList = reviewSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    
                    // Sort in memory by createdAt (descending)
                    const sortedReviews = reviewList.sort((a, b) => {
                        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                        return dateB - dateA;
                    });
                    
                    setReviews(sortedReviews);
                } catch (fallbackErr) {
                    console.error("Firebase error fetching reviews without index: ", fallbackErr);
                    setError("No se pudieron cargar las reseñas. Revisa las reglas de seguridad de Firebase y la consola del navegador.");
                }
            } else {
                setError("No se pudieron cargar las reseñas. Revisa las reglas de seguridad de Firebase y la consola del navegador.");
            }
        }
        setReviewsLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const usersList = await getAllUsers();
            setUsers(usersList);
        } catch (err) {
            console.error("Firebase error en fetchUsers: ", err);
            setError("No se pudieron cargar los usuarios. Revisa las reglas de seguridad de Firebase y la consola del navegador.");
        }
        setUsersLoading(false);
    };

    useEffect(() => {
        fetchProducts();
        fetchOrders();
        fetchReviews();
        fetchUsers();
    }, []);

    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
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
            
            showSuccessMessage("Rol de usuario actualizado exitosamente!");
        } catch (err) {
            console.error("Firebase error updating user role: ", err);
            setError("Error al actualizar el rol del usuario. ¿Tienes permisos de escritura?");
        }
    };

    // Delete user
    const deleteUser = async (userId, userName) => {
        // According to Firestore rules, users cannot be deleted
        // Show an appropriate message to the admin
        alert("Los usuarios no pueden ser eliminados según las reglas de seguridad de la aplicación. Puedes cambiar su rol a 'cliente' si es necesario.");
        return;
    };

    const handleChange = (e) => {
        setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
    };

    const handleEditChange = (e) => {
        setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
    };

    const handleImageChange = (index, value) => {
        const newImageUrls = [...newProduct.imageUrls];
        newImageUrls[index] = value;
        setNewProduct({ ...newProduct, imageUrls: newImageUrls });
    };

    const handleEditImageChange = (index, value) => {
        const newImageUrls = [...editingProduct.imageUrls];
        newImageUrls[index] = value;
        setEditingProduct({ ...editingProduct, imageUrls: newImageUrls });
    };

    // Handle file upload for new product
    const handleFileUpload = async (file) => {
        if (!file) return null;
        
        try {
            setUploading(true);
            const fileRef = ref(storage, `products/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            return url;
        } catch (error) {
            console.error("Error uploading file:", error);
            setError("Error al subir la imagen: " + error.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Handle file selection and upload
    const handleFileSelect = async (index, isEditing = false) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = await handleFileUpload(file);
                if (url) {
                    if (isEditing) {
                        // For editing, we need to ensure the array is large enough
                        const currentImages = [...editingProduct.imageUrls];
                        // Extend array if needed
                        while (currentImages.length <= index) {
                            currentImages.push('');
                        }
                        currentImages[index] = url;
                        setEditingProduct({ ...editingProduct, imageUrls: currentImages });
                    } else {
                        // For adding new product, we need to ensure the array is large enough
                        const currentImages = [...newProduct.imageUrls];
                        // Extend array if needed
                        while (currentImages.length <= index) {
                            currentImages.push('');
                        }
                        currentImages[index] = url;
                        setNewProduct({ ...newProduct, imageUrls: currentImages });
                    }
                }
            }
        };
        
        fileInput.click();
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

    // Handle multiple file uploads for new product (using base64 encoding)
    const handleMultipleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        setUploading(true);
        setError(null);
        
        try {
            const imageDataArray = [];
            
            // Limit to 4 images total
            const maxImages = 4;
            const currentCount = newProduct.imageUrls.length;
            const remainingSlots = maxImages - currentCount;
            
            if (remainingSlots <= 0) {
                setError("Ya has agregado el máximo de 4 imágenes.");
                setUploading(false);
                return;
            }
            
            // Process each file (up to remaining slots)
            const filesToProcess = Math.min(files.length, remainingSlots);
            
            for (let i = 0; i < filesToProcess; i++) {
                const file = files[i];
                
                // Check file size (limit to 1MB per image to avoid Firestore limits)
                if (file.size > 1024 * 1024) {
                    setError(`La imagen ${file.name} es demasiado grande. El tamaño máximo es 1MB.`);
                    continue;
                }
                
                try {
                    const base64Data = await fileToBase64(file);
                    imageDataArray.push({
                        name: file.name,
                        type: file.type,
                        data: base64Data,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    console.error("Error converting file to base64:", error);
                    setError("Error al procesar la imagen: " + file.name);
                }
            }
            
            // Update state with new image data
            setNewProduct(prev => ({
                ...prev,
                imageUrls: [...prev.imageUrls, ...imageDataArray]
            }));
            
            if (filesToProcess < files.length) {
                setError(`Solo se procesaron ${filesToProcess} imágenes. El máximo es 4.`);
            }
        } catch (error) {
            console.error("Error processing files:", error);
            setError("Error al procesar las imágenes: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Handle multiple file uploads for editing product (using base64 encoding)
    const handleEditMultipleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        setUploading(true);
        setError(null);
        
        try {
            const imageDataArray = [];
            
            // Limit to 4 images total
            const maxImages = 4;
            const currentCount = editingProduct.imageUrls.length;
            const remainingSlots = maxImages - currentCount;
            
            if (remainingSlots <= 0) {
                setError("Ya has agregado el máximo de 4 imágenes.");
                setUploading(false);
                return;
            }
            
            // Process each file (up to remaining slots)
            const filesToProcess = Math.min(files.length, remainingSlots);
            
            for (let i = 0; i < filesToProcess; i++) {
                const file = files[i];
                
                // Check file size (limit to 1MB per image to avoid Firestore limits)
                if (file.size > 1024 * 1024) {
                    setError(`La imagen ${file.name} es demasiado grande. El tamaño máximo es 1MB.`);
                    continue;
                }
                
                try {
                    const base64Data = await fileToBase64(file);
                    imageDataArray.push({
                        name: file.name,
                        type: file.type,
                        data: base64Data,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    console.error("Error converting file to base64:", error);
                    setError("Error al procesar la imagen: " + file.name);
                }
            }
            
            // Update state with new image data
            setEditingProduct(prev => ({
                ...prev,
                imageUrls: [...prev.imageUrls, ...imageDataArray]
            }));
            
            if (filesToProcess < files.length) {
                setError(`Solo se procesaron ${filesToProcess} imágenes. El máximo es 4.`);
            }
        } catch (error) {
            console.error("Error processing files:", error);
            setError("Error al procesar las imágenes: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Handle file selection for multiple uploads (new product)
    const handleMultipleFileSelect = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        
        fileInput.onchange = async (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                await handleMultipleFileUpload(files);
            }
        };
        
        fileInput.click();
    };

    // Handle file selection for edit multiple uploads
    const handleEditMultipleFileSelect = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        
        fileInput.onchange = async (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                await handleEditMultipleFileUpload(files);
            }
        };
        
        fileInput.click();
    };

    const setPrimaryImage = (index) => {
        setNewProduct({ ...newProduct, primaryImageIndex: index });
    };

    const setEditPrimaryImage = (index) => {
        setEditingProduct({ ...editingProduct, primaryImageIndex: index });
    };

    // Remove an image
    const removeImage = (index, isEditing = false) => {
        if (isEditing) {
            const newImages = [...editingProduct.imageUrls];
            newImages.splice(index, 1);
            
            // Adjust primary image index if needed
            let newPrimaryIndex = editingProduct.primaryImageIndex;
            if (index < editingProduct.primaryImageIndex) {
                newPrimaryIndex = Math.max(0, editingProduct.primaryImageIndex - 1);
            } else if (index === editingProduct.primaryImageIndex) {
                newPrimaryIndex = Math.min(newImages.length - 1, newPrimaryIndex);
            }
            
            setEditingProduct({
                ...editingProduct,
                imageUrls: newImages,
                primaryImageIndex: newPrimaryIndex
            });
        } else {
            const newImages = [...newProduct.imageUrls];
            newImages.splice(index, 1);
            
            // Adjust primary image index if needed
            let newPrimaryIndex = newProduct.primaryImageIndex;
            if (index < newProduct.primaryImageIndex) {
                newPrimaryIndex = Math.max(0, newProduct.primaryImageIndex - 1);
            } else if (index === newProduct.primaryImageIndex) {
                newPrimaryIndex = Math.min(newImages.length - 1, newPrimaryIndex);
            }
            
            setNewProduct({
                ...newProduct,
                imageUrls: newImages,
                primaryImageIndex: newPrimaryIndex
            });
        }
    };

    // Add a new image slot
    const addImageSlot = (isEditing = false) => {
        if (isEditing) {
            if (editingProduct.imageUrls.length < 4) {
                setEditingProduct({
                    ...editingProduct,
                    imageUrls: [...editingProduct.imageUrls, '']
                });
            }
        } else {
            if (newProduct.imageUrls.length < 4) {
                setNewProduct({
                    ...newProduct,
                    imageUrls: [...newProduct.imageUrls, '']
                });
            }
        }
    };

    // Remove an image slot
    const removeImageSlot = (index, isEditing = false) => {
        if (isEditing) {
            const newImages = [...editingProduct.imageUrls];
            newImages.splice(index, 1);
            // Adjust primary image index if needed
            let newPrimaryIndex = editingProduct.primaryImageIndex;
            if (index < editingProduct.primaryImageIndex) {
                newPrimaryIndex = Math.max(0, editingProduct.primaryImageIndex - 1);
            } else if (index === editingProduct.primaryImageIndex) {
                newPrimaryIndex = Math.min(newImages.length - 1, newPrimaryIndex);
            }
            setEditingProduct({
                ...editingProduct,
                imageUrls: newImages,
                primaryImageIndex: newPrimaryIndex
            });
        } else {
            const newImages = [...newProduct.imageUrls];
            newImages.splice(index, 1);
            // Adjust primary image index if needed
            let newPrimaryIndex = newProduct.primaryImageIndex;
            if (index < newProduct.primaryImageIndex) {
                newPrimaryIndex = Math.max(0, newProduct.primaryImageIndex - 1);
            } else if (index === newProduct.primaryImageIndex) {
                newPrimaryIndex = Math.min(newImages.length - 1, newPrimaryIndex);
            }
            setNewProduct({
                ...newProduct,
                imageUrls: newImages,
                primaryImageIndex: newPrimaryIndex
            });
        }
    };

    const openAddModal = () => {
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
            style: ''
        });
        setModalType('add');
        setIsModalOpen(true);
    };

    const openEditModal = (product) => {
        // Ensure the product has the imageUrls array and primaryImageIndex
        const productWithImages = {
            ...product,
            imageUrls: product.imageUrls || [],
            primaryImageIndex: product.primaryImageIndex || 0,
            stock: product.stock || 0,
            rating: product.rating || 0
        };
        setEditingProduct({ ...productWithImages });
        setModalType('edit');
        setIsModalOpen(true);
    };

    const openOrdersModal = () => {
        setModalType('orders');
        setIsModalOpen(true);
    };

    const openCouponsModal = () => {
        setModalType('coupons');
        setIsModalOpen(true);
    };

    const openReviewsModal = () => {
        setModalType('reviews');
        setIsModalOpen(true);
    };

    const openUsersModal = () => {
        setModalType('users');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setError(null);
    };

    const createProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price) {
            setError("Por favor, introduce al menos un nombre y un precio.");
            return;
        }
        try {
            // Filter out empty image URLs
            const validImageUrls = newProduct.imageUrls.filter(image => {
                if (typeof image === 'string') {
                    return image.trim() !== '';
                }
                if (typeof image === 'object' && image !== null) {
                    return image.data && image.data.trim() !== '';
                }
                return false;
            });
            
            await addDoc(productsCollectionRef, { 
                name: newProduct.name,
                description: newProduct.description,
                price: parseFloat(newProduct.price) || 0,
                stock: parseInt(newProduct.stock) || 0,
                rating: parseFloat(newProduct.rating) || 0,
                imageUrls: validImageUrls,
                primaryImageIndex: Math.min(newProduct.primaryImageIndex, Math.max(0, validImageUrls.length - 1)),
                category: newProduct.category,
                material: newProduct.material,
                color: newProduct.color,
                size: newProduct.size,
                style: newProduct.style,
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
            setError(null);
            showSuccessMessage("Producto añadido exitosamente!");
            closeModal();
            fetchProducts(); // Recargar productos
        } catch (err) {
            console.error("Firebase error: ", err);
            setError("Error al crear el producto. ¿Tienes permisos de escritura?");
        }
    };

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

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!editingProduct.name || !editingProduct.price) {
            setError("Por favor, introduce al menos un nombre y un precio.");
            return;
        }
        try {
            // Filter out empty image URLs
            const validImageUrls = editingProduct.imageUrls.filter(image => {
                if (typeof image === 'string') {
                    return image.trim() !== '';
                }
                if (typeof image === 'object' && image !== null) {
                    return image.data && image.data.trim() !== '';
                }
                return false;
            });
            
            const productDoc = doc(db, "products", editingProduct.id);
            await updateDoc(productDoc, {
                name: editingProduct.name,
                description: editingProduct.description,
                price: parseFloat(editingProduct.price) || 0,
                stock: parseInt(editingProduct.stock) || 0,
                rating: parseFloat(editingProduct.rating) || 0,
                imageUrls: validImageUrls,
                primaryImageIndex: Math.min(editingProduct.primaryImageIndex, Math.max(0, validImageUrls.length - 1)),
                category: editingProduct.category,
                material: editingProduct.material,
                color: editingProduct.color,
                size: editingProduct.size,
                style: editingProduct.style,
                updatedAt: new Date()
            });
            setEditingProduct(null);
            setError(null);
            showSuccessMessage("Producto actualizado exitosamente!");
            closeModal();
            fetchProducts(); // Recargar productos
        } catch (err) {
            console.error("Firebase error: ", err);
            setError("Error al actualizar el producto. ¿Tienes permisos de escritura?");
        }
    };

    // Update order status
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const orderDoc = doc(db, "orders", orderId);
            await updateDoc(orderDoc, {
                orderStatus: newStatus,
                updatedAt: new Date()
            });
            
            // Update local state
            setOrders(orders.map(order => 
                order.id === orderId 
                    ? { ...order, orderStatus: newStatus, updatedAt: new Date() }
                    : order
            ));
            
            showSuccessMessage("Estado de orden actualizado exitosamente!");
        } catch (err) {
            console.error("Firebase error updating order status: ", err);
            setError("Error al actualizar el estado de la orden. ¿Tienes permisos de escritura?");
        }
    };

    // Delete a review
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
        setModalType('editReview');
        setIsModalOpen(true);
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
        try {
            await updateReview(editingReview.id, {
                rating: editingReview.rating,
                comment: editingReview.comment
            });
            
            // Update local state
            setReviews(reviews.map(review => 
                review.id === editingReview.id 
                    ? { ...review, rating: editingReview.rating, comment: editingReview.comment }
                    : review
            ));
            
            setEditingReview(null);
            setError(null);
            showSuccessMessage("Reseña actualizada exitosamente!");
            closeModal();
        } catch (err) {
            console.error("Firebase error: ", err);
            setError("Error al actualizar la reseña. ¿Tienes permisos de escritura?");
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

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-indigo-100 text-indigo-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Get status text in Spanish
    const getStatusText = (status) => {
        switch (status) {
            case 'pending':
                return 'Pendiente';
            case 'processing':
                return 'Procesando';
            case 'shipped':
                return 'Enviado';
            case 'delivered':
                return 'Entregado';
            case 'cancelled':
                return 'Cancelado';
            default:
                return status;
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    const closeOrderDetails = () => {
        setIsOrderModalOpen(false);
        setSelectedOrder(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-white shadow">
                <div className="flex items-center justify-between px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">Panel de Administración - Tienda de Moños</h1>
                    <div className="flex items-center">
                        <span className="mr-4 text-sm text-gray-500">Administrador</span>
                        <div className="flex items-center justify-center w-8 h-8 font-semibold text-white bg-indigo-600 rounded-full">
                            {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
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

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="overflow-hidden bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-3 bg-indigo-500 rounded-md">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                    </svg>
                                </div>
                                <div className="flex-1 w-0 ml-5">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Productos</dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">{products.length}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-3 bg-green-500 rounded-md">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <div className="flex-1 w-0 ml-5">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Productos Vendidos</dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">0</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-3 bg-yellow-500 rounded-md">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 w-0 ml-5">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Ingresos Totales</dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">$0.00</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-3 bg-blue-500 rounded-md">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div className="flex-1 w-0 ml-5">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Órdenes</dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">{orders.length}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-hidden bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-3 bg-purple-500 rounded-md">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 w-0 ml-5">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Reseñas</dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">{reviews.length}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-hidden bg-white rounded-lg shadow">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 p-3 bg-green-500 rounded-md">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 w-0 ml-5">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Usuarios</dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">{users.length}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-medium leading-6 text-gray-900">Gestión de Moños</h2>
                                <p className="mt-1 text-sm text-gray-500">Administra todos los moños de tu tienda</p>
                            </div>
                            <div className="flex mt-4 space-x-3 md:mt-0">
                                <button 
                                    onClick={openUsersModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Usuarios
                                </button>
                                <button 
                                    onClick={openReviewsModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Reseñas
                                </button>
                                <button 
                                    onClick={openCouponsModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Cupones
                                </button>
                                <button 
                                    onClick={openOrdersModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Ver Órdenes
                                </button>
                                <button 
                                    onClick={openAddModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Añadir Moño
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-4 py-5 sm:px-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Moño</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Precio</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Categoría</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Material</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Color</th>
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
                                    ) : products.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay moños disponibles</td>
                                        </tr>
                                    ) : (
                                        products.map((product) => (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 w-10 h-10">
                                                            <img 
                                                                className="object-cover w-10 h-10 rounded-md" 
                                                                src={
                                                                    product.imageUrls && product.imageUrls.length > 0 
                                                                        ? (product.imageUrls[product.primaryImageIndex] && typeof product.imageUrls[product.primaryImageIndex] === 'object' 
                                                                            ? product.imageUrls[product.primaryImageIndex].data 
                                                                            : (typeof product.imageUrls[product.primaryImageIndex] === 'string' 
                                                                                ? product.imageUrls[product.primaryImageIndex] 
                                                                                : (product.imageUrls[0] && typeof product.imageUrls[0] === 'object' 
                                                                                    ? product.imageUrls[0].data 
                                                                                    : (typeof product.imageUrls[0] === 'string' 
                                                                                        ? product.imageUrls[0] 
                                                                                        : 'https://via.placeholder.com/40x40.png?text=Moño'))))
                                                                        : 'https://via.placeholder.com/40x40.png?text=Moño'
                                                                } 
                                                                alt={product.name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://via.placeholder.com/40x40.png?text=Moño';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                            <div className="text-sm text-gray-500 line-clamp-1">{product.description || 'Sin descripción'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    ${parseFloat(product.price).toLocaleString('es-CO')}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {product.category || 'Sin categoría'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {product.material || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {product.color || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                    <button 
                                                        onClick={() => openEditModal(product)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteProduct(product.id, product.name)}
                                                        className="ml-2 text-red-600 hover:text-red-900"
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

                {/* Content Section */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-medium leading-6 text-gray-900">Gestión de Órdenes</h2>
                                <p className="mt-1 text-sm text-gray-500">Administra todas las órdenes de tu tienda</p>
                            </div>
                            <div className="flex mt-4 space-x-3 md:mt-0">
                                <button 
                                    onClick={openOrdersModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Ver Órdenes
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-4 py-5 sm:px-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Usuario</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Estado</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {ordersLoading ? (
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
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay órdenes disponibles</td>
                                        </tr>
                                    ) : (
                                        orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {order.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {order.userEmail || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatCurrency(order.total)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatDate(order.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.orderStatus)}`}>
                                                        {getStatusText(order.orderStatus)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                    <button 
                                                        onClick={() => openOrderDetails(order)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Ver Detalles
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

                {/* Content Section */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-medium leading-6 text-gray-900">Gestión de Reseñas</h2>
                                <p className="mt-1 text-sm text-gray-500">Administra todas las reseñas de tu tienda</p>
                            </div>
                            <div className="flex mt-4 space-x-3 md:mt-0">
                                <button 
                                    onClick={openReviewsModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Reseñas
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-4 py-5 sm:px-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Usuario</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rating</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Comentario</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {reviewsLoading ? (
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
                                    ) : reviews.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay reseñas disponibles</td>
                                        </tr>
                                    ) : (
                                        reviews.map((review) => (
                                            <tr key={review.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {review.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {review.userEmail || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    <StarRating rating={review.rating} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {review.comment || 'Sin comentario'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatDate(review.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                    <button 
                                                        onClick={() => openEditReviewModal(review)}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteReviewHandler(review.id)}
                                                        className="ml-2 text-red-600 hover:text-red-900"
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

                {/* Content Section */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-medium leading-6 text-gray-900">Gestión de Usuarios</h2>
                                <p className="mt-1 text-sm text-gray-500">Administra todos los usuarios de tu tienda</p>
                            </div>
                            <div className="flex mt-4 space-x-3 md:mt-0">
                                <button 
                                    onClick={openUsersModal}
                                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Usuarios
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="px-4 py-5 sm:px-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nombre</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rol</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Última Actualización</th>
                                        <th scope="col" className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {usersLoading ? (
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
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay usuarios disponibles</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {user.email || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select 
                                                        className="px-2 py-1 border border-gray-300 rounded" 
                                                        value={user.role} 
                                                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                                                    >
                                                        <option value="admin">Administrador</option>
                                                        <option value="customer">Cliente</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {formatDate(user.updatedAt)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                    <button 
                                                        onClick={() => deleteUser(user.id, user.name)}
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
            </main>

            {/* Add/Edit Product Modal */}
            {isModalOpen && modalType === 'add' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Añadir Nuevo Moño
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                <form onSubmit={createProduct} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">Nombre del Moño</label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="name"
                                                required
                                                value={newProduct.name}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Moño Elegante Rojo"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="price" className="block mb-1 text-sm font-medium text-gray-700">Precio ($)</label>
                                            <input
                                                type="text"
                                                name="price"
                                                id="price"
                                                required
                                                value={newProduct.price}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: 25990"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="stock" className="block mb-1 text-sm font-medium text-gray-700">Stock</label>
                                            <input
                                                type="text"
                                                name="stock"
                                                id="stock"
                                                required
                                                value={newProduct.stock}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: 10"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="material" className="block mb-1 text-sm font-medium text-gray-700">Material</label>
                                            <input
                                                type="text"
                                                name="material"
                                                id="material"
                                                value={newProduct.material}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Satén, Seda"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="color" className="block mb-1 text-sm font-medium text-gray-700">Color</label>
                                            <input
                                                type="text"
                                                name="color"
                                                id="color"
                                                value={newProduct.color}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Rojo, Negro"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="size" className="block mb-1 text-sm font-medium text-gray-700">Tamaño</label>
                                            <input
                                                type="text"
                                                name="size"
                                                id="size"
                                                value={newProduct.size}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Grande, Mediano"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="style" className="block mb-1 text-sm font-medium text-gray-700">Estilo</label>
                                            <input
                                                type="text"
                                                name="style"
                                                id="style"
                                                value={newProduct.style}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Clásico, Moderno"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700">Categoría</label>
                                        <select
                                            name="category"
                                            id="category"
                                            value={newProduct.category}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                                        <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">Descripción</label>
                                        <textarea
                                            name="description"
                                            id="description"
                                            rows={3}
                                            value={newProduct.description}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Describe las características especiales del moño..."
                                        ></textarea>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="rating" className="block mb-1 text-sm font-medium text-gray-700">Rating (0-5 estrellas)</label>
                                        <input
                                            type="text"
                                            name="rating"
                                            id="rating"
                                            value={newProduct.rating}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ej: 4.5"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Imágenes del Producto</label>
                                        
                                        {/* Image previews */}
                                        {newProduct.imageUrls.length > 0 && (
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                {newProduct.imageUrls.map((imageData, index) => (
                                                    <div key={index} className="relative group">
                                                        <img 
                                                            src={imageData && typeof imageData === 'object' && imageData.data ? imageData.data : (typeof imageData === 'string' ? imageData : 'https://via.placeholder.com/150x150.png?text=Moño')} 
                                                            alt={`Preview ${index + 1}`} 
                                                            className="object-cover w-full h-32 border rounded-md"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/150x150.png?text=Error';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 bg-black bg-opacity-0 rounded-md group-hover:bg-opacity-30">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPrimaryImage(index)}
                                                                className={`px-2 py-1 text-xs rounded ${newProduct.primaryImageIndex === index ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 opacity-0 group-hover:opacity-100'}`}
                                                            >
                                                                {newProduct.primaryImageIndex === index ? 'Principal' : 'Hacer Principal'}
                                                            </button>
                                                        </div>
                                                        {newProduct.primaryImageIndex === index && (
                                                            <div className="absolute px-2 py-1 text-xs text-white bg-indigo-600 rounded top-2 left-2">
                                                                Principal
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index, false)}
                                                            className="absolute flex items-center justify-center w-6 h-6 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Add images button */}
                                        <button
                                            type="button"
                                            onClick={handleMultipleFileSelect}
                                            className="flex flex-col items-center justify-center w-full px-4 py-3 text-gray-500 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 hover:text-gray-600"
                                            disabled={uploading || newProduct.imageUrls.length >= 4}
                                        >
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                            </svg>
                                            <span className="text-sm font-medium">
                                                Agregar imágenes ({newProduct.imageUrls.length}/4)
                                            </span>
                                            <span className="mt-1 text-xs">
                                                {4 - newProduct.imageUrls.length} espacios disponibles
                                            </span>
                                        </button>
                                        
                                        <p className="mt-2 text-xs text-gray-500">
                                            Selecciona hasta 4 imágenes de tu computadora. La imagen marcada como "Principal" se mostrará en la lista de productos.
                                        </p>
                                        
                                        {uploading && (
                                            <div className="flex items-center mt-3">
                                                <div className="w-5 h-5 mr-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                                                <span className="text-sm text-indigo-600">Subiendo imágenes...</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Añadir Moño
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Product Modal */}
            {isModalOpen && modalType === 'edit' && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    Editar Moño
                                </h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                <form onSubmit={saveEdit} className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="edit-name" className="block mb-1 text-sm font-medium text-gray-700">Nombre del Moño</label>
                                            <input
                                                type="text"
                                                name="name"
                                                id="edit-name"
                                                required
                                                value={editingProduct.name}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Moño Elegante Rojo"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="edit-price" className="block mb-1 text-sm font-medium text-gray-700">Precio ($)</label>
                                            <input
                                                type="text"
                                                name="price"
                                                id="edit-price"
                                                required
                                                value={editingProduct.price}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: 25990"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="edit-stock" className="block mb-1 text-sm font-medium text-gray-700">Stock</label>
                                            <input
                                                type="text"
                                                name="stock"
                                                id="edit-stock"
                                                required
                                                value={editingProduct.stock}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: 10"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="edit-material" className="block mb-1 text-sm font-medium text-gray-700">Material</label>
                                            <input
                                                type="text"
                                                name="material"
                                                id="edit-material"
                                                value={editingProduct.material}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Satén, Seda"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="edit-color" className="block mb-1 text-sm font-medium text-gray-700">Color</label>
                                            <input
                                                type="text"
                                                name="color"
                                                id="edit-color"
                                                value={editingProduct.color}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Rojo, Negro"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="edit-size" className="block mb-1 text-sm font-medium text-gray-700">Tamaño</label>
                                            <input
                                                type="text"
                                                name="size"
                                                id="edit-size"
                                                value={editingProduct.size}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Grande, Mediano"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="edit-style" className="block mb-1 text-sm font-medium text-gray-700">Estilo</label>
                                            <input
                                                type="text"
                                                name="style"
                                                id="edit-style"
                                                value={editingProduct.style}
                                                onChange={handleEditChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Ej: Clásico, Moderno"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit-category" className="block mb-1 text-sm font-medium text-gray-700">Categoría</label>
                                        <select
                                            name="category"
                                            id="edit-category"
                                            value={editingProduct.category}
                                            onChange={handleEditChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                                        <label htmlFor="edit-description" className="block mb-1 text-sm font-medium text-gray-700">Descripción</label>
                                        <textarea
                                            name="description"
                                            id="edit-description"
                                            rows={3}
                                            value={editingProduct.description}
                                            onChange={handleEditChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Describe las características especiales del moño..."
                                        ></textarea>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit-rating" className="block mb-1 text-sm font-medium text-gray-700">Rating (0-5 estrellas)</label>
                                        <input
                                            type="text"
                                            name="rating"
                                            id="edit-rating"
                                            value={editingProduct.rating}
                                            onChange={handleEditChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ej: 4.5"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block mb-1 text-sm font-medium text-gray-700">Imágenes del Producto</label>
                                        
                                        {/* Image previews */}
                                        {editingProduct.imageUrls.length > 0 && (
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                {editingProduct.imageUrls.map((imageData, index) => (
                                                    <div key={index} className="relative group">
                                                        <img 
                                                            src={imageData && typeof imageData === 'object' && imageData.data ? imageData.data : (typeof imageData === 'string' ? imageData : 'https://via.placeholder.com/150x150.png?text=Moño')} 
                                                            alt={`Preview ${index + 1}`} 
                                                            className="object-cover w-full h-32 border rounded-md"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://via.placeholder.com/150x150.png?text=Error';
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 bg-black bg-opacity-0 rounded-md group-hover:bg-opacity-30">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditPrimaryImage(index)}
                                                                className={`px-2 py-1 text-xs rounded ${editingProduct.primaryImageIndex === index ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 opacity-0 group-hover:opacity-100'}`}
                                                            >
                                                                {editingProduct.primaryImageIndex === index ? 'Principal' : 'Hacer Principal'}
                                                            </button>
                                                        </div>
                                                        {editingProduct.primaryImageIndex === index && (
                                                            <div className="absolute px-2 py-1 text-xs text-white bg-indigo-600 rounded top-2 left-2">
                                                                Principal
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(index, true)}
                                                            className="absolute flex items-center justify-center w-6 h-6 text-white transition-opacity bg-red-500 rounded-full opacity-0 top-2 right-2 group-hover:opacity-100"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Add images button */}
                                        <button
                                            type="button"
                                            onClick={handleEditMultipleFileSelect}
                                            className="flex flex-col items-center justify-center w-full px-4 py-3 text-gray-500 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 hover:text-gray-600"
                                            disabled={uploading || editingProduct.imageUrls.length >= 4}
                                        >
                                            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                            </svg>
                                            <span className="text-sm font-medium">
                                                Agregar imágenes ({editingProduct.imageUrls.length}/4)
                                            </span>
                                            <span className="mt-1 text-xs">
                                                {4 - editingProduct.imageUrls.length} espacios disponibles
                                            </span>
                                        </button>
                                        
                                        <p className="mt-2 text-xs text-gray-500">
                                            Selecciona hasta 4 imágenes de tu computadora. La imagen marcada como "Principal" se mostrará en la lista de productos.
                                        </p>
                                        
                                        {uploading && (
                                            <div className="flex items-center mt-3">
                                                <div className="w-5 h-5 mr-2 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
                                                <span className="text-sm text-indigo-600">Subiendo imágenes...</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Modal */}
            {isModalOpen && modalType === 'users' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Usuarios Registrados</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                {usersLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No hay usuarios registrados aún.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Nombre</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Email</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Rol</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha de Registro</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                            <div>
                                                                <div className="font-medium">{user.name || user.displayName || 'N/A'}</div>
                                                                <div className="text-xs text-gray-500">ID: {user.id?.substring(0, 8) || 'N/A'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            {user.email || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                                user.role === 'admin' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            {formatDate(user.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
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
                                                            <button
                                                                onClick={() => deleteUser(user.id, user.name || user.displayName || user.email)}
                                                                className="ml-2 px-3 py-1 text-xs rounded-md bg-red-100 text-red-800 hover:bg-red-200"
                                                                title="Los usuarios no pueden ser eliminados según las reglas de seguridad"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Review Modal */}
            {isModalOpen && modalType === 'editReview' && editingReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Editar Reseña</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                <div className="mb-4">
                                    <label htmlFor="reviewRating" className="block text-sm font-medium text-gray-700">Calificación</label>
                                    <select
                                        id="reviewRating"
                                        value={editingReview?.rating || 5}
                                        onChange={(e) => setEditingReview({...editingReview, rating: parseInt(e.target.value)})}
                                        className="block w-full py-1 text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="1">1 Estrella</option>
                                        <option value="2">2 Estrellas</option>
                                        <option value="3">3 Estrellas</option>
                                        <option value="4">4 Estrellas</option>
                                        <option value="5">5 Estrellas</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700">Comentario</label>
                                    <textarea
                                        id="reviewComment"
                                        value={editingReview?.comment || ''}
                                        onChange={(e) => setEditingReview({...editingReview, comment: e.target.value})}
                                        className="block w-full py-1 text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Use the proper save function
                                        if (editingReview) {
                                            saveEditedReview({ preventDefault: () => {} });
                                        }
                                    }}
                                    className="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mt-2">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    if (editingReview) {
                                        saveEditedReview(e);
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleEditRatingClick(star)}
                                                    className="text-2xl focus:outline-none"
                                                >
                                                    {star <= (editingReview?.rating || 0) ? (
                                                        <span className="text-yellow-400">★</span>
                                                    ) : (
                                                        <span className="text-gray-300">☆</span>
                                                    )}
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-500">
                                                {editingReview?.rating || 0} de 5 estrellas
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit-comment" className="block text-sm font-medium text-gray-700 mb-2">
                                            Comentario
                                        </label>
                                        <textarea
                                            id="edit-comment"
                                            name="comment"
                                            rows={4}
                                            value={editingReview?.comment || ''}
                                            onChange={handleReviewEditChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Modal */}
            {isModalOpen && modalType === 'orders' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Órdenes Recientes</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                {ordersLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No hay órdenes registradas aún.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">ID</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cliente</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Productos</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Método de Pago</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Estado</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {orders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <button 
                                                                onClick={() => openOrderDetails(order)}
                                                                className="text-indigo-600 underline hover:text-indigo-900"
                                                            >
                                                                {order.id.substring(0, 8)}...
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                            <div>
                                                                <div className="font-medium">{order.userEmail || 'N/A'}</div>
                                                                <div className="text-xs text-gray-500">ID: {order.userId?.substring(0, 8) || 'N/A'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            {formatDate(order.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <div>
                                                                {order.items?.length || 0} {order.items?.length === 1 ? 'producto' : 'productos'}
                                                                {order.items && order.items.length > 0 && (
                                                                    <div className="mt-1 text-xs text-gray-500">
                                                                        {order.items.slice(0, 2).map((item, idx) => (
                                                                            <div key={idx}>{item.name} x{item.quantity}</div>
                                                                        ))}
                                                                        {order.items.length > 2 && (
                                                                            <div className="text-xs text-gray-400">+{order.items.length - 2} más</div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                            {formatCurrency(order.totalAmount || 0)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <div className="space-y-1">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {order.paymentMethod || 'N/A'}
                                                                </span>
                                                                {order.paymentStatus && (
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                        {order.paymentStatus === 'completed' ? 'Pagado' : 'Pendiente'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getStatusBadgeClass(order.orderStatus || 'pending')}>
                                                                    {getStatusText(order.orderStatus || 'pending')}
                                                                </span>
                                                                <select
                                                                    value={order.orderStatus || 'pending'}
                                                                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                                    className="block w-full py-1 text-xs border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                                                >
                                                                    <option value="pending">Pendiente</option>
                                                                    <option value="processing">Procesando</option>
                                                                    <option value="shipped">Enviado</option>
                                                                    <option value="delivered">Entregado</option>
                                                                    <option value="cancelled">Cancelado</option>
                                                                </select>
                                                            </div>
                                                            {order.address && (
                                                                <div className="mt-1 text-xs text-gray-500">
                                                                    {order.address.city}, {order.address.state}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coupons Modal */}
            {isModalOpen && modalType === 'coupons' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-6xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Gestión de Cupones</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mt-2">
                                <CouponManager />
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Reviews Modal */}
            {isModalOpen && modalType === 'reviews' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Reseñas de Productos</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                {reviewsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No hay reseñas registradas aún.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Producto</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Usuario</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Calificación</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Comentario</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reviews.map((review) => (
                                                    <tr key={review.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <div className="font-medium">{review.productId || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                            <div>
                                                                <div className="font-medium">{review.userName || 'N/A'}</div>
                                                                <div className="text-xs text-gray-500">{review.userEmail || 'N/A'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <StarRating rating={review.rating} size="sm" />
                                                                <span className="ml-2">{review.rating}/5</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                                            <div className="line-clamp-2">{review.comment || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            {formatDate(review.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                            <button
                                                                onClick={() => openEditReviewModal(review)}
                                                                className="mr-3 text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => deleteReviewHandler(review.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Review Modal */}
            {isModalOpen && modalType === 'editReview' && editingReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Editar Reseña</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                <form onSubmit={saveEditedReview} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleEditRatingClick(star)}
                                                    className="text-2xl focus:outline-none"
                                                >
                                                    {star <= editingReview.rating ? (
                                                        <span className="text-yellow-400">★</span>
                                                    ) : (
                                                        <span className="text-gray-300">☆</span>
                                                    )}
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-500">
                                                {editingReview.rating} de 5 estrellas
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit-comment" className="block text-sm font-medium text-gray-700 mb-2">
                                            Comentario
                                        </label>
                                        <textarea
                                            id="edit-comment"
                                            name="comment"
                                            rows={4}
                                            value={editingReview.comment}
                                            onChange={handleReviewEditChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Order Details Modal */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Detalles del Pedido</h3>
                                <button
                                    onClick={closeOrderDetails}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                {selectedOrder && (
                                    <div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900">Información del Pedido</h4>
                                                <div className="mt-2 space-y-2">
                                                    <div>
                                                        <p className="text-sm text-gray-500">ID del Pedido</p>
                                                        <p className="text-gray-900">{selectedOrder.id}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Fecha del Pedido</p>
                                                        <p className="text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Estado del Pedido</p>
                                                        <span className={'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' + getStatusBadgeClass(selectedOrder.orderStatus || 'pending')}>
                                                            {getStatusText(selectedOrder.orderStatus || 'pending')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900">Información del Cliente</h4>
                                                <div className="mt-2 space-y-2">
                                                    <div>
                                                        <p className="text-sm text-gray-500">Nombre</p>
                                                        <p className="text-gray-900">{selectedOrder.userName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Email</p>
                                                        <p className="text-gray-900">{selectedOrder.userEmail || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500">Teléfono</p>
                                                        <p className="text-gray-900">{selectedOrder.address?.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6">
                                            <h4 className="text-lg font-medium text-gray-900">Dirección de Entrega</h4>
                                            <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                                                <p className="text-gray-900">
                                                    {selectedOrder.address?.street || 'N/A'}
                                                </p>
                                                <p className="text-gray-900">
                                                    {selectedOrder.address?.city || 'N/A'}, {selectedOrder.address?.state || 'N/A'} {selectedOrder.address?.zip || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6">
                                            <h4 className="text-lg font-medium text-gray-900">Productos</h4>
                                            <div className="mt-2 overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Producto</th>
                                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cantidad</th>
                                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Precio</th>
                                                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {selectedOrder.items?.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                                    <div className="font-medium">{item.name}</div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                                    {item.quantity}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                                    {formatCurrency(item.price)}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                                    {formatCurrency(item.price * item.quantity)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div>
                                                    <h4 className="text-lg font-medium text-gray-900">Método de Pago</h4>
                                                    <div className="mt-2 space-y-2">
                                                        <div>
                                                            <p className="text-sm text-gray-500">Método</p>
                                                            <p className="text-gray-900">{selectedOrder.paymentMethod || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Estado del Pago</p>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedOrder.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {selectedOrder.paymentStatus === 'completed' ? 'Pagado' : 'Pendiente'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <h4 className="text-lg font-medium text-gray-900">Resumen del Pedido</h4>
                                                    <div className="mt-2 space-y-2">
                                                        <div className="flex justify-between">
                                                            <p className="text-gray-500">Subtotal</p>
                                                            <p className="text-gray-900">{formatCurrency(selectedOrder.subtotal || 0)}</p>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <p className="text-gray-500">Impuestos</p>
                                                            <p className="text-gray-900">{formatCurrency(selectedOrder.tax || 0)}</p>
                                                        </div>
                                                        <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                                                            <p className="text-lg font-medium text-gray-900">Total</p>
                                                            <p className="text-lg font-medium text-gray-900">{formatCurrency(selectedOrder.totalAmount || 0)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeOrderDetails}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Product Details Modal */}
            {isModalOpen && modalType === 'productDetails' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Detalles del Producto</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ID del Producto</label>
                                    <p className="text-gray-900">{selectedProduct?.id}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
                                    <p className="text-gray-900">{selectedProduct?.name}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                    <p className="text-gray-900">{selectedProduct?.description}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
                                    <p className="text-gray-900">{formatCurrency(selectedProduct?.price || 0)}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                                    <p className="text-gray-900">{selectedProduct?.stock || 0}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                                    <p className="text-gray-900">{selectedProduct?.sku}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                                    <p className="text-gray-900">{selectedProduct?.category}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                                    <div className="space-x-1">
                                        {selectedProduct?.tags?.map((tag, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagenes</label>
                                    <div className="space-x-1">
                                        {selectedProduct?.images?.map((image, idx) => (
                                            <img key={idx} src={image} alt={`Product Image ${idx + 1}`} className="w-20 h-20 object-cover rounded-md" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Coupons Modal */}
            {isModalOpen && modalType === 'coupons' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-6xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Gestión de Cupones</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="mt-2">
                                <CouponManager />
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Reviews Modal */}
            {isModalOpen && modalType === 'reviews' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Reseñas de Productos</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                {reviewsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No hay reseñas registradas aún.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Producto</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Usuario</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Calificación</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Comentario</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Fecha</th>
                                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reviews.map((review) => (
                                                    <tr key={review.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <div className="font-medium">{review.productId || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                                            <div>
                                                                <div className="font-medium">{review.userName || 'N/A'}</div>
                                                                <div className="text-xs text-gray-500">{review.userEmail || 'N/A'}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <StarRating rating={review.rating} size="sm" />
                                                                <span className="ml-2">{review.rating}/5</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                                                            <div className="line-clamp-2">{review.comment || 'N/A'}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                            {formatDate(review.createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                                                            <button
                                                                onClick={() => openEditReviewModal(review)}
                                                                className="mr-3 text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Editar
                                                            </button>
                                                            <button
                                                                onClick={() => deleteReviewHandler(review.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Review Modal */}
            {isModalOpen && modalType === 'editReview' && editingReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black bg-opacity-50">
                    <div className="relative w-full max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold text-gray-900">Editar Reseña</h3>
                                <button
                                    onClick={closeModal}
                                    className="text-2xl font-bold text-gray-400 hover:text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="mt-2">
                                <form onSubmit={saveEditedReview} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
                                        <div className="flex items-center">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => handleEditRatingClick(star)}
                                                    className="text-2xl focus:outline-none"
                                                >
                                                    {star <= editingReview.rating ? (
                                                        <span className="text-yellow-400">★</span>
                                                    ) : (
                                                        <span className="text-gray-300">☆</span>
                                                    )}
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-gray-500">
                                                {editingReview.rating} de 5 estrellas
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="edit-comment" className="block text-sm font-medium text-gray-700 mb-2">
                                            Comentario
                                        </label>
                                        <textarea
                                            id="edit-comment"
                                            name="comment"
                                            rows={4}
                                            value={editingReview.comment}
                                            onChange={handleReviewEditChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                                        />
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 space-x-3">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Order Details Modal */}
            <OrderDetailsModal
                order={selectedOrder}
                isOpen={isOrderModalOpen}
                onClose={closeOrderDetails}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getOrderStatusText={getStatusText}
                getStatusBadgeClass={getStatusBadgeClass}
            />
        </div>
    );
};

export default AdminDashboard;