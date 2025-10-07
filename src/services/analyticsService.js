import { db } from '../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { formatCurrency } from './orderService';

// Get sales data by date range
export const getSalesData = async (startDate, endDate) => {
  try {
    const ordersCollection = collection(db, 'orders');
    const q = query(
      ordersCollection, 
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    const orderSnapshot = await getDocs(q);
    const orders = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Group orders by date
    const salesByDate = {};
    let totalRevenue = 0;
    let totalOrders = 0;
    
    orders.forEach(order => {
      const date = order.createdAt.toDate().toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          totalSales: 0,
          orderCount: 0,
          revenue: 0
        };
      }
      
      const orderTotal = order.totalAmount || 0;
      salesByDate[date].totalSales += orderTotal;
      salesByDate[date].orderCount += 1;
      salesByDate[date].revenue += orderTotal;
      totalRevenue += orderTotal;
      totalOrders += 1;
    });
    
    // Convert to array and sort by date
    const salesData = Object.values(salesByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return {
      salesData,
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  } catch (error) {
    console.error('Error fetching sales data:', error);
    throw error;
  }
};

// Get sales data by category
export const getSalesByCategory = async () => {
  try {
    // Get all products with their categories
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    const products = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get all orders
    const ordersCollection = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCollection);
    const orders = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Create a product ID to category mapping
    const productCategoryMap = {};
    products.forEach(product => {
      productCategoryMap[product.id] = product.category || 'Sin categoría';
    });
    
    // Calculate sales by category
    const categorySales = {};
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const category = productCategoryMap[item.productId] || 'Sin categoría';
          if (!categorySales[category]) {
            categorySales[category] = {
              category,
              sales: 0,
              quantity: 0,
              revenue: 0
            };
          }
          
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          categorySales[category].sales += itemTotal;
          categorySales[category].quantity += item.quantity || 0;
          categorySales[category].revenue += itemTotal;
        });
      }
    });
    
    // Convert to array and sort by revenue
    const salesByCategory = Object.values(categorySales).sort((a, b) => 
      b.revenue - a.revenue
    );
    
    return salesByCategory;
  } catch (error) {
    console.error('Error fetching sales by category:', error);
    throw error;
  }
};

// Get order status distribution
export const getOrderStatusDistribution = async () => {
  try {
    const ordersCollection = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCollection);
    const orders = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const statusDistribution = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      const status = order.orderStatus || 'pending';
      if (status in statusDistribution) {
        statusDistribution[status]++;
      }
    });
    
    // Convert to array format for charts
    const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
      status,
      count
    }));
    
    return statusData;
  } catch (error) {
    console.error('Error fetching order status distribution:', error);
    throw error;
  }
};

// Get top selling products
export const getTopSellingProducts = async (limit = 10) => {
  try {
    // Get all products
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    const products = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get all orders
    const ordersCollection = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCollection);
    const orders = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Create a product ID to name mapping
    const productNameMap = {};
    products.forEach(product => {
      productNameMap[product.id] = product.name || 'Producto sin nombre';
    });
    
    // Calculate sales by product
    const productSales = {};
    
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productId = item.productId;
          if (!productSales[productId]) {
            productSales[productId] = {
              productId,
              productName: productNameMap[productId] || 'Producto desconocido',
              sales: 0,
              quantity: 0,
              revenue: 0
            };
          }
          
          const itemTotal = (item.price || 0) * (item.quantity || 0);
          productSales[productId].sales += itemTotal;
          productSales[productId].quantity += item.quantity || 0;
          productSales[productId].revenue += itemTotal;
        });
      }
    });
    
    // Convert to array, sort by revenue, and limit
    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
    
    return topSellingProducts;
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    throw error;
  }
};

// Get user registration data
export const getUserRegistrationData = async (startDate, endDate) => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(
      usersCollection, 
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    const userSnapshot = await getDocs(q);
    const users = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Group users by registration date
    const registrationsByDate = {};
    let totalUsers = 0;
    
    users.forEach(user => {
      const date = user.createdAt.toDate().toISOString().split('T')[0];
      if (!registrationsByDate[date]) {
        registrationsByDate[date] = {
          date,
          registrations: 0
        };
      }
      
      registrationsByDate[date].registrations += 1;
      totalUsers += 1;
    });
    
    // Convert to array and sort by date
    const registrationData = Object.values(registrationsByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return {
      registrationData,
      totalUsers
    };
  } catch (error) {
    console.error('Error fetching user registration data:', error);
    throw error;
  }
};

// Get revenue by payment method
export const getRevenueByPaymentMethod = async () => {
  try {
    const ordersCollection = collection(db, 'orders');
    const orderSnapshot = await getDocs(ordersCollection);
    const orders = orderSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const paymentMethodRevenue = {};
    
    orders.forEach(order => {
      const paymentMethod = order.paymentMethod || 'Desconocido';
      const revenue = order.totalAmount || 0;
      
      if (!paymentMethodRevenue[paymentMethod]) {
        paymentMethodRevenue[paymentMethod] = {
          method: paymentMethod,
          revenue: 0,
          count: 0
        };
      }
      
      paymentMethodRevenue[paymentMethod].revenue += revenue;
      paymentMethodRevenue[paymentMethod].count += 1;
    });
    
    // Convert to array
    const revenueByPaymentMethod = Object.values(paymentMethodRevenue);
    
    return revenueByPaymentMethod;
  } catch (error) {
    console.error('Error fetching revenue by payment method:', error);
    throw error;
  }
};