import React, { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../App';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        coupon: action.payload.coupon || null,
      };
    
    case 'ADD_TO_CART':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        // Check stock limit if available
        const newQuantity = existingItem.quantity + (action.payload.quantity || 1);
        const stockLimit = action.payload.stock !== undefined ? action.payload.stock : Infinity;
        
        if (newQuantity > stockLimit) {
          // Don't exceed stock limit
          return state;
        }
        
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: newQuantity }
              : item
          ),
        };
      }
      
      // Check stock for new item
      const initialQuantity = action.payload.quantity || 1;
      const itemStock = action.payload.stock !== undefined ? action.payload.stock : Infinity;
      
      if (initialQuantity > itemStock) {
        // Don't exceed stock limit
        return state;
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: initialQuantity }],
      };
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    
    case 'UPDATE_QUANTITY':
      // Find the item to get stock info
      const itemToUpdate = state.items.find(item => item.id === action.payload.id);
      if (!itemToUpdate) return state;
      
      const stockLimit = itemToUpdate.stock !== undefined ? itemToUpdate.stock : Infinity;
      
      // Don't allow quantity to exceed stock
      const newQuantity = Math.min(action.payload.quantity, stockLimit);
      
      if (newQuantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: newQuantity }
            : item
        ),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        coupon: null,
      };
    
    case 'APPLY_COUPON':
      return {
        ...state,
        coupon: action.payload,
      };
    
    case 'REMOVE_COUPON':
      return {
        ...state,
        coupon: null,
      };
    
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], coupon: null });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const initialCartLoad = useRef(true);
  
  console.log('CartProvider initialized with currentUser:', currentUser);

  // Load cart from Firestore when user logs in
  const loadCartFromFirestore = useCallback(async () => {
    // Always reset loading state when starting
    setLoading(true);
    
    if (!currentUser) {
      console.log('No user logged in, clearing cart');
      // If no user, clear local cart
      dispatch({ type: 'SET_CART', payload: { items: [], coupon: null } });
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to load cart from Firestore for user:', currentUser.uid);
      const userCartRef = doc(db, 'carts', currentUser.uid);
      const docSnap = await getDoc(userCartRef);
      
      if (docSnap.exists()) {
        const cartData = docSnap.data();
        console.log('Cart data loaded from Firestore:', cartData);
        dispatch({ type: 'SET_CART', payload: { items: cartData.items || [], coupon: cartData.coupon || null } });
      } else {
        console.log('No cart found for user, initializing empty cart');
        // No cart exists for this user, initialize with empty cart
        dispatch({ type: 'SET_CART', payload: { items: [], coupon: null } });
      }
    } catch (error) {
      console.error('Error loading cart from Firestore:', error);
      console.error('Error details:', error.code, error.message);
      // Fallback to empty cart
      dispatch({ type: 'SET_CART', payload: { items: [], coupon: null } });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Load cart when user changes
  useEffect(() => {
    console.log('CartProvider useEffect triggered with currentUser:', currentUser);
    loadCartFromFirestore();
  }, [currentUser, loadCartFromFirestore]);

  // Save cart to Firestore whenever cart changes and user is logged in
  useEffect(() => {
    // Don't save during initial load or if no user
    if (!currentUser || loading || initialCartLoad.current) {
      if (initialCartLoad.current) {
        console.log('Skipping save during initial cart load');
        initialCartLoad.current = false;
      }
      return;
    }
    
    const saveCartToFirestore = async () => {
      console.log('Saving cart to Firestore:', {
        userId: currentUser.uid,
        itemsCount: state.items.length,
        items: state.items,
        coupon: state.coupon
      });
      
      try {
        const userCartRef = doc(db, 'carts', currentUser.uid);
        // Add a unique timestamp to force update
        const dataToSave = {
          userId: currentUser.uid,
          items: state.items.map(item => ({
            ...item,
            lastUpdated: Date.now()
          })),
          coupon: state.coupon,
          updatedAt: new Date().toISOString(),
          timestamp: Date.now()
        };
        
        await setDoc(userCartRef, dataToSave, { merge: true });
        console.log('Successfully saved cart to Firestore with data:', dataToSave);
        
        // Verify the save was successful by reading it back
        const verificationSnap = await getDoc(userCartRef);
        if (verificationSnap.exists()) {
          console.log('Verification: Cart successfully saved and can be read back');
        } else {
          console.error('Verification: Failed to verify cart save');
        }
      } catch (error) {
        console.error('Error saving cart to Firestore:', error);
        console.error('Error details:', error.code, error.message);
      }
    };

    // Debounce saves to prevent multiple rapid saves
    const timeoutId = setTimeout(() => {
      saveCartToFirestore();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.items, state.coupon, currentUser, loading]);

  const addToCart = (product) => {
    console.log('Adding to cart:', product);
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = async (productId) => {
    console.log('Removing from cart:', productId);
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    
    // Also remove from Firestore
    if (currentUser) {
      try {
        const userCartRef = doc(db, 'carts', currentUser.uid);
        // We'll update the entire cart instead of trying to remove a field
        // The useEffect will handle saving the updated cart
      } catch (error) {
        console.error('Error removing item from Firestore cart:', error);
      }
    }
  };

  const updateQuantity = (productId, quantity) => {
    console.log('Updating quantity:', productId, quantity);
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' });
    
    // Also clear from Firestore
    if (currentUser) {
      try {
        const userCartRef = doc(db, 'carts', currentUser.uid);
        await setDoc(userCartRef, {
          userId: currentUser.uid,
          items: [],
          coupon: null,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error clearing cart in Firestore:', error);
      }
    }
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    const subtotal = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Apply coupon discount if available
    if (state.coupon) {
      if (state.coupon.discountType === 'percentage') {
        return subtotal * (1 - state.coupon.discountValue / 100);
      } else if (state.coupon.discountType === 'fixed') {
        return Math.max(0, subtotal - state.coupon.discountValue);
      }
    }
    
    return subtotal;
  };

  const applyCoupon = async (couponCode) => {
    try {
      // Query Firestore for the coupon
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('code', '==', couponCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Cupón no válido');
      }
      
      const couponDoc = querySnapshot.docs[0];
      const couponData = { id: couponDoc.id, ...couponDoc.data() };
      
      // Check if coupon is active
      if (!couponData.isActive) {
        throw new Error('Este cupón no está activo');
      }
      
      // Check if coupon has expired
      const currentDate = new Date();
      if (couponData.expiryDate && currentDate > couponData.expiryDate.toDate()) {
        throw new Error('Este cupón ha expirado');
      }
      
      // Apply coupon
      dispatch({ type: 'APPLY_COUPON', payload: couponData });
      return couponData;
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  };

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
  };

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        coupon: state.coupon,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};