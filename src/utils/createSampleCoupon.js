import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Create a sample coupon for testing
const createSampleCoupon = async () => {
  try {
    const couponData = {
      code: 'DESCUENTO10',
      discountType: 'percentage',
      discountValue: 10,
      isActive: true,
      createdAt: new Date()
    };
    
    const docRef = await addDoc(collection(db, 'coupons'), couponData);
    console.log('Sample coupon created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating sample coupon: ', error);
    throw error;
  }
};

export default createSampleCoupon;