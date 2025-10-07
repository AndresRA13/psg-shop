# Firestore Rules Update Instructions

## Issue
The current Firestore rules don't allow admin users to update other users' roles, which is causing the "Error al actualizar el rol del usuario. ¿Tienes permisos de escritura?" error.

## Solution
Update the Firestore rules to allow admins to update user documents.

## Steps to Update Firestore Rules

1. Go to the Firebase Console
2. Select your project
3. Navigate to Firestore Database
4. Click on the "Rules" tab
5. Replace the existing rules with the updated rules below
6. Click "Publish"

## Updated Rules

```
rules_version = '2';

service cloud.firestore {

  match /databases/{database}/documents {

    // Allow anyone to read the products collection
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read and write their own user document
    // Allow admins to read and update all user documents
    match /users/{userId} {
      // Users can read and write their own document
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Admins can read all user documents
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';

      // Admins can update user roles
      allow update: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow anyone to read the categories collection
    match /categories/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read and write their own cart
    match /carts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read and write their own wishlist
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow users to read and write their own orders
    // Allow admins to read all orders
    match /orders/{orderId} {
      // Users can read and write their own orders
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         // Admins can read all orders
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      // Allow creating orders
      allow create: if request.auth != null;
    }
    
    // Allow admins to manage coupons
    match /coupons/{couponId} {
      // Only admins can read, create, update, and delete coupons
      allow read, create, update, delete: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow users to read reviews
    // Allow users to create and update their own reviews
    // Allow admins to manage all reviews
    match /reviews/{reviewId} {
      // Anyone can read reviews
      allow read: if true;
      
      // Users can create reviews
      allow create: if request.auth != null;
      
      // Users can update their own reviews
      // Admins can update any review
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      // Users can delete their own reviews
      // Admins can delete any review
      allow delete: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

  }

}
```

## Additional Fixes Made

1. Fixed the user role select dropdown in the main users table to use correct role values ("admin" and "customer" instead of "admin", "client", and "moderator")

## After Updating Rules

After updating the Firestore rules:
1. Refresh your admin dashboard
2. Try updating a user's role again
3. The error should be resolved

If you continue to experience issues, please check the browser console for any additional error messages.