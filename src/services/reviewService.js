import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';

// Create a new review
export const createReview = async (reviewData) => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    const docRef = await addDoc(reviewsCollection, {
      ...reviewData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return {
      id: docRef.id,
      ...reviewData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// Get reviews by product ID
export const getReviewsByProductId = async (productId) => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    const q = query(reviewsCollection, where('productId', '==', productId), orderBy('createdAt', 'desc'));
    const reviewSnapshot = await getDocs(q);
    const reviewList = reviewSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return reviewList;
  } catch (error) {
    // Check if it's a missing index error
    if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
      console.warn('Missing index for reviews query, using fallback method. Create the required index for better performance.');
      // Fallback to unordered query and sort in memory
      try {
        const reviewsCollection = collection(db, 'reviews');
        const q = query(reviewsCollection, where('productId', '==', productId));
        const reviewSnapshot = await getDocs(q);
        const reviewList = reviewSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort in memory by createdAt (descending)
        const sortedReviews = reviewList.sort((a, b) => {
          // Handle different date formats
          let dateA, dateB;
          
          // For Firestore timestamps
          if (a.createdAt && typeof a.createdAt.toDate === 'function') {
            dateA = a.createdAt.toDate();
          } 
          // For JavaScript Date objects
          else if (a.createdAt instanceof Date) {
            dateA = a.createdAt;
          } 
          // For string dates
          else if (typeof a.createdAt === 'string') {
            dateA = new Date(a.createdAt);
          } 
          // For numeric timestamps
          else if (typeof a.createdAt === 'number') {
            dateA = new Date(a.createdAt);
          } 
          // Default
          else {
            dateA = new Date(0);
          }
          
          // Same for dateB
          if (b.createdAt && typeof b.createdAt.toDate === 'function') {
            dateB = b.createdAt.toDate();
          } else if (b.createdAt instanceof Date) {
            dateB = b.createdAt;
          } else if (typeof b.createdAt === 'string') {
            dateB = new Date(b.createdAt);
          } else if (typeof b.createdAt === 'number') {
            dateB = new Date(b.createdAt);
          } else {
            dateB = new Date(0);
          }
          
          return dateB - dateA;
        });
        
        return sortedReviews;
      } catch (fallbackErr) {
        console.error('Error fetching reviews without index:', fallbackErr);
        throw fallbackErr;
      }
    } else {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }
};

// Get reviews by user ID and product ID (to check if user already reviewed a product)
export const getUserReviewForProduct = async (userId, productId) => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    const q = query(
      reviewsCollection,
      where('userId', '==', userId),
      where('productId', '==', productId)
    );
    const reviewSnapshot = await getDocs(q);
    
    if (reviewSnapshot.empty) {
      return null;
    }
    
    // Return the first (and should be only) review
    const reviewDoc = reviewSnapshot.docs[0];
    return {
      id: reviewDoc.id,
      ...reviewDoc.data()
    };
  } catch (error) {
    console.error('Error fetching user review for product:', error);
    throw error;
  }
};

// Get all reviews (for admin)
export const getAllReviews = async () => {
  try {
    const reviewsCollection = collection(db, 'reviews');
    const q = query(reviewsCollection, orderBy('createdAt', 'desc'));
    const reviewSnapshot = await getDocs(q);
    const reviewList = reviewSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return reviewList;
  } catch (error) {
    // Check if it's a missing index error
    if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
      console.warn('Missing index for all reviews query, using fallback method. Create the required index for better performance.');
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
          // Handle different date formats
          let dateA, dateB;
          
          // For Firestore timestamps
          if (a.createdAt && typeof a.createdAt.toDate === 'function') {
            dateA = a.createdAt.toDate();
          } 
          // For JavaScript Date objects
          else if (a.createdAt instanceof Date) {
            dateA = a.createdAt;
          } 
          // For string dates
          else if (typeof a.createdAt === 'string') {
            dateA = new Date(a.createdAt);
          } 
          // For numeric timestamps
          else if (typeof a.createdAt === 'number') {
            dateA = new Date(a.createdAt);
          } 
          // Default
          else {
            dateA = new Date(0);
          }
          
          // Same for dateB
          if (b.createdAt && typeof b.createdAt.toDate === 'function') {
            dateB = b.createdAt.toDate();
          } else if (b.createdAt instanceof Date) {
            dateB = b.createdAt;
          } else if (typeof b.createdAt === 'string') {
            dateB = new Date(b.createdAt);
          } else if (typeof b.createdAt === 'number') {
            dateB = new Date(b.createdAt);
          } else {
            dateB = new Date(0);
          }
          
          return dateB - dateA;
        });
        
        return sortedReviews;
      } catch (fallbackErr) {
        console.error('Error fetching all reviews without index:', fallbackErr);
        throw fallbackErr;
      }
    } else {
      console.error('Error fetching all reviews:', error);
      throw error;
    }
  }
};

// Update a review
export const updateReview = async (id, reviewData) => {
  try {
    const reviewDoc = doc(db, 'reviews', id);
    await updateDoc(reviewDoc, {
      ...reviewData,
      updatedAt: new Date()
    });
    return {
      id,
      ...reviewData,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

// Delete a review
export const deleteReview = async (id) => {
  try {
    const reviewDoc = doc(db, 'reviews', id);
    await deleteDoc(reviewDoc);
    return id;
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};