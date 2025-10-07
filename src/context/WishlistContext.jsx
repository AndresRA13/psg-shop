import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const initialWishlistLoad = useRef(true);

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
    return product.imageUrl || 'https://via.placeholder.com/600x600.png?text=Moño';
  };

  // Load wishlist from Firestore when user logs in
  const loadWishlistFromFirestore = useCallback(async () => {
    // Always reset loading state when starting
    setLoading(true);

    if (!currentUser) {
      // If no user, clear local wishlist
      setWishlist([]);
      setLoading(false);
      initialWishlistLoad.current = false; // Set to false even when no user
      return;
    }

    try {
      const userWishlistRef = doc(db, 'wishlists', currentUser.uid);
      const docSnap = await getDoc(userWishlistRef);

      if (docSnap.exists()) {
        const wishlistData = docSnap.data();
        setWishlist(wishlistData.items || []);
      } else {
        // No wishlist exists for this user, initialize with empty wishlist
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error loading wishlist from Firestore:', error);
      // Fallback to empty wishlist
      setWishlist([]);
    } finally {
      setLoading(false);
      initialWishlistLoad.current = false; // Set to false after loading
    }
  }, [currentUser]);

  // Load wishlist when user changes
  useEffect(() => {
    loadWishlistFromFirestore();
  }, [currentUser, loadWishlistFromFirestore]);

  // Save wishlist to Firestore whenever wishlist changes and user is logged in
  useEffect(() => {
    // Don't save during initial load or if no user
    if (!currentUser || loading || initialWishlistLoad.current) {
      return;
    }

    const saveWishlistToFirestore = async () => {
      try {
        const userWishlistRef = doc(db, 'wishlists', currentUser.uid);
        // Add a unique timestamp to force update
        const dataToSave = {
          userId: currentUser.uid,
          items: wishlist.map(item => ({
            ...item,
            lastUpdated: Date.now()
          })),
          updatedAt: new Date().toISOString(),
          timestamp: Date.now()
        };

        await setDoc(userWishlistRef, dataToSave, { merge: true });

        // Verify the save was successful by reading it back
        const verificationSnap = await getDoc(userWishlistRef);
        if (!verificationSnap.exists()) {
          console.error('Verification: Failed to verify wishlist save');
        }
      } catch (error) {
        console.error('Error saving wishlist to Firestore:', error);
      }
    };

    // Debounce saves to prevent multiple rapid saves
    const timeoutId = setTimeout(() => {
      saveWishlistToFirestore();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [wishlist, currentUser, loading]);

  const addToWishlist = (product) => {
    setWishlist(prevWishlist => {
      // Check if product already exists in wishlist
      const exists = prevWishlist.find(item => item.id === product.id);
      if (exists) {
        return prevWishlist;
      }
      // Ensure we use the primary image selected in the admin panel
      const productWithPrimaryImage = {
        ...product,
        imageUrl: getPrimaryImageUrl(product)
      };
      return [...prevWishlist, productWithPrimaryImage];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prevWishlist => prevWishlist.filter(item => item.id !== productId));
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  const clearWishlist = async () => {
    setWishlist([]);
    
    // Also clear from Firestore
    if (currentUser) {
      try {
        const userWishlistRef = doc(db, 'wishlists', currentUser.uid);
        await setDoc(userWishlistRef, {
          userId: currentUser.uid,
          items: [],
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error clearing wishlist in Firestore:', error);
      }
    }
  };

  const getTotalItems = () => {
    return wishlist.length;
  };

  // Expose a function to manually trigger loading
  const refreshWishlist = () => {
    loadWishlistFromFirestore();
  };

  return (
    <WishlistContext.Provider
      value={{
        items: wishlist,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        getTotalItems,
        refreshWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};