import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

// Format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

// Format date for display
export const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date instanceof Date) {
        return date.toLocaleDateString('es-CO');
    }
    if (date.toDate) {
        return date.toDate().toLocaleDateString('es-CO');
    }
    return 'N/A';
};

// Get status text in Spanish
export const getOrderStatusText = (status) => {
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

// Get status badge class
export const getStatusBadgeClass = (status) => {
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

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const ordersCollection = collection(db, 'orders');
    const docRef = await addDoc(ordersCollection, {
      ...orderData,
      createdAt: new Date(),
      status: 'pending'
    });
    return {
      id: docRef.id,
      ...orderData,
      createdAt: new Date(),
      status: 'pending'
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get orders by user ID
export const getOrdersByUserId = async (userId) => {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const orderSnapshot = await getDocs(q);
    const orderList = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return orderList;
  } catch (error) {
    console.error('Error fetching orders:', error);
    // Check if it's a missing index error
    if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
      // Fallback to unordered query and sort in memory
      try {
        const ordersCollection = collection(db, 'orders');
        const q = query(ordersCollection, where('userId', '==', userId));
        const orderSnapshot = await getDocs(q);
        const orderList = orderSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory by createdAt (descending)
        const sortedOrders = orderList.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        
        return sortedOrders;
      } catch (fallbackErr) {
        console.error('Error fetching orders without index:', fallbackErr);
        throw fallbackErr;
      }
    } else {
      throw error;
    }
  }
};

// Get order by ID
export const getOrderById = async (id) => {
  try {
    const orderDoc = doc(db, 'orders', id);
    const orderSnapshot = await getDoc(orderDoc);
    if (orderSnapshot.exists()) {
      return {
        id: orderSnapshot.id,
        ...orderSnapshot.data()
      };
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (id, status) => {
  try {
    const orderDoc = doc(db, 'orders', id);
    await updateDoc(orderDoc, { 
      orderStatus: status,
      updatedAt: new Date()
    });
    return { id, status };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Get all orders (for admin)
export const getAllOrders = async () => {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(ordersCollection, orderBy('createdAt', 'desc'));
    const orderSnapshot = await getDocs(q);
    const orderList = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return orderList;
  } catch (error) {
    console.error('Error fetching all orders:', error);
    // Check if it's a missing index error
    if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
      // Fallback to unordered query and sort in memory
      try {
        const ordersCollection = collection(db, 'orders');
        const orderSnapshot = await getDocs(ordersCollection);
        const orderList = orderSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory by createdAt (descending)
        const sortedOrders = orderList.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        
        return sortedOrders;
      } catch (fallbackErr) {
        console.error('Error fetching all orders without index:', fallbackErr);
        throw fallbackErr;
      }
    } else {
      throw error;
    }
  }
};