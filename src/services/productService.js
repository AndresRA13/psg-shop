import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Get all products
export const getProducts = async () => {
  try {
    const productsCollection = collection(db, 'products');
    const productSnapshot = await getDocs(productsCollection);
    const productList = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return productList;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id) => {
  try {
    const productDoc = doc(db, 'products', id);
    const productSnapshot = await getDoc(productDoc);
    if (productSnapshot.exists()) {
      return {
        id: productSnapshot.id,
        ...productSnapshot.data()
      };
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const productsCollection = collection(db, 'products');
    const q = query(productsCollection, where('category', '==', category));
    const productSnapshot = await getDocs(q);
    const productList = productSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return productList;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

// Create a new product
export const createProduct = async (productData) => {
  try {
    const productsCollection = collection(db, 'products');
    const docRef = await addDoc(productsCollection, productData);
    return {
      id: docRef.id,
      ...productData
    };
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update a product
export const updateProduct = async (id, productData) => {
  try {
    const productDoc = doc(db, 'products', id);
    await updateDoc(productDoc, productData);
    return {
      id,
      ...productData
    };
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    const productDoc = doc(db, 'products', id);
    await deleteDoc(productDoc);
    return id;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};