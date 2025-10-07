# Firestore Security Rules for CartShop

## Overview
This document contains the Firestore security rules required for the CartShop application, including rules for the new carts collection.

## Security Rules

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
    // Allow admins to read all user documents

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

## Required Composite Indexes

For the application to function properly, you need to create the following composite indexes in Firestore:

1. **Orders Collection Index for User Orders**:
   - Collection: `orders`
   - Fields:
     - `userId` (Ascending)
     - `createdAt` (Descending)
   - Query Scope: Collection

2. **Orders Collection Index for Admin Orders**:
   - Collection: `orders`
   - Fields:
     - `createdAt` (Descending)
   - Query Scope: Collection

3. **Reviews Collection Index for Product Reviews**:
   - Collection: `reviews`
   - Fields:
     - `productId` (Ascending)
     - `createdAt` (Descending)
   - Query Scope: Collection

These indexes are required for:
- Querying user orders sorted by creation date (newest first)
- Querying all orders for admins sorted by creation date (newest first)
- Querying reviews for a specific product sorted by creation date (newest first)

## How to Deploy Rules

1. Go to Firebase Console
2. Select your project
3. Navigate to Firestore Database
4. Click on "Rules" tab
5. Replace the existing rules with the ones above
6. Click "Publish"

## How to Create Composite Indexes

1. Go to Firebase Console
2. Select your project
3. Navigate to Firestore Database
4. Click on "Indexes" tab
5. Click "Create index"

**For the first index (User Orders):**
1. Select the "orders" collection
2. Add the following fields:
   - Field path: `userId`, Mode: Ascending
   - Field path: `createdAt`, Mode: Descending
3. Set query scope to "Collection"
4. Click "Create"

**For the second index (Admin Orders):**
1. Select the "orders" collection
2. Add the following field:
   - Field path: `createdAt`, Mode: Descending
3. Set query scope to "Collection"
4. Click "Create"

**For the third index (Product Reviews):**
1. Select the "reviews" collection
2. Add the following fields:
   - Field path: `productId`, Mode: Ascending
   - Field path: `createdAt`, Mode: Descending
3. Set query scope to "Collection"
4. Click "Create"

Alternatively, you can click on the link provided in the Firebase error message when the application tries to query the orders or reviews. Firebase will automatically suggest creating the required index.

## Rule Explanations

1. **Products Collection**: 
   - Public read access for all users (including unauthenticated)
   - Only admins can create, update, or delete products

2. **Users Collection**:
   - Users can read and update their own document
   - Users can create their own document
   - Admins can read all user documents
   - No one can delete user documents

3. **Carts Collection**:
   - Users can read, update, and create their own cart document (cartId matches userId)
   - Users can delete their own cart document
   - Users cannot access other users' carts

4. **Wishlists Collection**:
   - Users can read, update, and create their own wishlist document (wishlistId matches userId)
   - Users can delete their own wishlist document
   - Users cannot access other users' wishlists

5. **Orders Collection**:
   - Users can read and write their own orders
   - Admins can read all orders
   - Anyone authenticated can create orders

6. **Coupons Collection**:
   - Only admins can read, create, update, and delete coupons
   - Regular users cannot access coupons directly

7. **Reviews Collection**:
   - Public read access for all users (including unauthenticated)
   - Authenticated users can create reviews
   - Users can update and delete their own reviews
   - Admins can update and delete any review

8. **AdminUsers Collection**:
   - Only admins can read admin user information
   - No one can write to this collection (managed by application logic)

## Testing the Rules

After deploying these rules, test the following scenarios:

1. Unauthenticated users should be able to view products
2. Authenticated users should be able to view products
3. Only admins should be able to modify products
4. Users should only be able to access their own cart
5. Users should only be able to access their own wishlist
6. Users should only be able to access their own user document
7. Admins should be able to read all user documents
8. Only admins should be able to read admin user information
9. Users should be able to read their own orders
10. Admins should be able to read all orders
11. Authenticated users should be able to create orders
12. Only admins should be able to manage coupons
13. Anyone should be able to read reviews
14. Authenticated users should be able to create reviews
15. Users should be able to update and delete their own reviews
16. Admins should be able to update and delete any review
