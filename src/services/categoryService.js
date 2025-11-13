import { db, storage } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Get all categories
export const getCategories = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const categories = [];
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Create a new category
export const createCategory = async (categoryData) => {
  try {
    // If there's an image, ensure it's properly formatted
    const dataToSave = { ...categoryData };
    if (dataToSave.imageUrl && dataToSave.imageUrl.startsWith('data:')) {
      // Keep base64 image as is for Firestore storage
      // Firestore can handle base64 strings
    }
    
    const docRef = await addDoc(collection(db, 'categories'), {
      ...dataToSave,
      createdAt: new Date()
    });
    return { id: docRef.id, ...dataToSave, createdAt: new Date() };
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update a category
export const updateCategory = async (categoryId, categoryData) => {
  try {
    const categoryDoc = doc(db, 'categories', categoryId);
    
    // If there's an image, ensure it's properly formatted
    const dataToUpdate = { ...categoryData };
    if (dataToUpdate.imageUrl && dataToUpdate.imageUrl.startsWith('data:')) {
      // Keep base64 image as is for Firestore storage
      // Firestore can handle base64 strings
    }
    
    const updatedData = { ...dataToUpdate, updatedAt: new Date() };
    await updateDoc(categoryDoc, updatedData);
    return { id: categoryId, ...updatedData };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (categoryId) => {
  try {
    const categoryDoc = doc(db, 'categories', categoryId);
    await deleteDoc(categoryDoc);
    return categoryId;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Upload category image
export const uploadCategoryImage = async (file, categoryId) => {
  try {
    const storageRef = ref(storage, `categories/${categoryId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading category image:', error);
    throw error;
  }
};