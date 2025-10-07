import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';

// Get user by ID
export const getUserById = async (id) => {
  try {
    const userDoc = doc(db, 'users', id);
    const userSnapshot = await getDoc(userDoc);
    if (userSnapshot.exists()) {
      return {
        id: userSnapshot.id,
        ...userSnapshot.data()
      };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (id, userData) => {
  try {
    const userDoc = doc(db, 'users', id);
    await updateDoc(userDoc, userData);
    return {
      id,
      ...userData
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Get all users (for admin)
export const getAllUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return userList;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Update user role (for admin)
export const updateUserRole = async (id, role) => {
  try {
    const userDoc = doc(db, 'users', id);
    await updateDoc(userDoc, { role });
    return { id, role };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};