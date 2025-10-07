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
    console.error('Error fetching reviews:', error);
    // Check if it's a missing index error
    if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
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
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        
        return sortedReviews;
      } catch (fallbackErr) {
        console.error('Error fetching reviews without index:', fallbackErr);
        throw fallbackErr;
      }
    } else {
      throw error;
    }
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
    console.error('Error fetching all reviews:', error);
    // Check if it's a missing index error
    if (error.code === 'failed-precondition' || (error.message && error.message.includes('index'))) {
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
        
        return sortedReviews;
      } catch (fallbackErr) {
        console.error('Error fetching all reviews without index:', fallbackErr);
        throw fallbackErr;
      }
    } else {
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