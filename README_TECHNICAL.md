# PSG SHOP - E-commerce de Moños (Technical Documentation)

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Data Models](#data-models)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Integration](#api-integration)
9. [State Management](#state-management)
10. [Development Setup](#development-setup)
11. [Deployment](#deployment)
12. [Testing](#testing)
13. [Performance Considerations](#performance-considerations)
14. [Security Considerations](#security-considerations)
15. [Troubleshooting](#troubleshooting)

## Project Overview

PSG SHOP is a full-featured e-commerce application built with React for selling decorative bows ("moños"). The application provides both customer-facing shopping capabilities and an admin backend for managing products, coupons, reviews, and analytics.

### Key Features
- User authentication with Firebase Authentication
- Product catalog management with Firestore
- Shopping cart with React Context
- Admin dashboard for CRUD operations
- Coupon system for discounts
- Product review system with star ratings
- Responsive UI with Tailwind CSS
- Protected routes and role-based access control
- Wishlist functionality (planned)

## System Architecture

The application follows a frontend-centric single-page application (SPA) architecture using React with Firebase as the backend-as-a-service (BaaS). The architecture implements a component-based modular design with separation of concerns across contexts, services, and UI components.

### Architectural Patterns
- **Context Pattern**: `AuthContext`, `CartContext`, and `WishlistContext` manage global states
- **Component Composition**: Reusable UI components (e.g., `StarRating`, `Loader`, `Navbar`)
- **Service Layer Abstraction**: Services in `/services` encapsulate Firebase interactions
- **Route Guard Pattern**: Protected and admin-only routes enforce access control
- **Single Source of Truth**: Firebase acts as the central data store

### Component Interaction
- Components consume context providers (Auth, Cart) for shared state
- Services interact directly with Firebase and are called from components/pages
- Pages orchestrate components and service calls
- Navigation managed via `react-router-dom`

## Technology Stack

### Frontend Framework
- React 19 (via `react`, `react-dom`)

### Routing
- React Router DOM v7.9.1

### Styling
- Tailwind CSS v4.1.13 + Vite plugin

### State Management
- React Context API

### Authentication & Database
- Firebase v12.3.0 (Auth + Firestore)

### Icons
- `react-icons`, Font Awesome

### Charts
- Recharts v3.2.1 for admin dashboards

### UI Feedback
- SweetAlert2

### Build Tool
- Vite v7.1.2

### Linting
- ESLint with React plugins

### Payment Processing
- PayPal JavaScript SDK

### Form Handling
- Formspree for contact forms

## Project Structure

```
src/
├── assets/
│   ├── pages/              # All page components
│   └── routes/             # Route configuration and guards
├── components/             # Reusable UI elements
│   ├── charts/             # Chart components for admin dashboard
│   └── ...                 # Other UI components
├── context/                # Global state providers
├── hooks/                  # Custom hooks
├── services/               # Firebase interaction layer
├── utils/                  # Helper functions
├── App.jsx                 # Main application component
├── firebase.js             # Firebase initialization
└── main.jsx                # Application entry point
```

## Core Components

### Authentication Components
- `login.jsx`: User login with email/password and Google authentication
- `Register.jsx`: User registration with email/password and Google authentication
- `ResetPassword.jsx`: Password reset functionality
- `AuthContext.jsx`: Authentication state management

### Product Components
- `Shop.jsx`: Product listing with filtering and search
- `ProductDetail.jsx`: Detailed product view with image gallery
- `StarRating.jsx`: Reusable star rating component

### Cart Components
- `Cart.jsx`: Shopping cart management
- `CartContext.jsx`: Cart state management
- `Checkout.jsx`: Checkout process with address management and payment options

### User Components
- `Profile.jsx`: User profile management
- `Orders.jsx`: Order history
- `Wishlist.jsx`: Wishlist functionality (planned)

### Admin Components
- `ModernAdminDashboard.jsx`: Main admin dashboard with multiple sections
- `CouponManager.jsx`: Coupon creation and management
- `ProductReviews.jsx`: Review management

### Navigation Components
- `navbar.jsx`: Main navigation bar with mobile support
- `footer.jsx`: Site footer

## Data Models

### User
```javascript
{
  id: string,
  email: string,
  displayName: string,
  profileImage: string,
  role: 'customer' | 'admin',
  createdAt: Date,
  addresses: [
    {
      id: string,
      name: string,
      street: string,
      city: string,
      state: string,
      zipCode: string,
      country: string,
      isDefault: boolean
    }
  ]
}
```

### Product
```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  category: string,
  imageUrls: [string], // Base64 encoded images
  primaryImageIndex: number,
  material: string,
  color: string,
  size: string,
  style: string,
  stock: number,
  rating: number, // Average rating
  createdAt: Date,
  updatedAt: Date
}
```

### Order
```javascript
{
  id: string,
  userId: string,
  userEmail: string,
  items: [
    {
      id: string,
      name: string,
      price: number,
      quantity: number,
      imageUrl: string
    }
  ],
  subtotal: number,
  discount: number,
  totalAmount: number,
  totalAmountUSD: number, // For PayPal payments
  address: {
    name: string,
    street: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
  },
  paymentMethod: 'PayPal' | 'Cash on Delivery',
  paymentStatus: 'pending' | 'completed',
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
  coupon: object,
  createdAt: Date,
  updatedAt: Date
}
```

### Coupon
```javascript
{
  id: string,
  code: string,
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  isActive: boolean,
  expiryDate: Date,
  createdAt: Date
}
```

### Review
```javascript
{
  id: string,
  productId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Authentication & Authorization

### Authentication Flow
1. Users can register/login with email/password or Google OAuth
2. Firebase Authentication handles user credentials
3. User data is stored in Firestore `users` collection
4. Session persistence is maintained using browser local storage

### Authorization
- Role-based access control with `customer` and `admin` roles
- Protected routes using `ProtectedRoute` component
- Admin-only routes using `AdminRoute` component
- Admin users are manually created via the admin setup process

### User Roles
- **Customer**: Can browse products, add to cart, checkout, and manage profile
- **Admin**: All customer privileges plus access to admin dashboard for managing products, coupons, and reviews

## API Integration

### Firebase Integration
- **Authentication**: Firebase Authentication for user management
- **Database**: Firestore for data storage
- **Storage**: Firebase Storage for file uploads (though currently using base64 encoding for images)

### PayPal Integration
- PayPal JavaScript SDK for payment processing
- Currency conversion from COP to USD for PayPal transactions
- Order creation in Firestore upon successful payment

### Formspree Integration
- Contact form submissions via Formspree service

## State Management

### React Context API
The application uses React Context for global state management:

1. **AuthContext**: Manages user authentication state and role information
2. **CartContext**: Manages shopping cart items and coupon application
3. **WishlistContext**: Manages wishlist items (planned)

### Context Providers
Context providers are initialized in `App.jsx` and wrap the entire application to ensure global access to state.

## Development Setup

### Prerequisites
- Node.js v14 or higher
- npm or yarn
- Firebase account

### Installation Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd psg-shop
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory with Firebase configuration:
   ```
   VITE_API_KEY=your-api-key
   VITE_AUTH_DOMAIN=your-auth-domain
   VITE_PROJECT_ID=your-project-id
   VITE_STORAGE_BUCKET=your-storage-bucket
   VITE_MESSAGING_SENDER_ID=your-sender-id
   VITE_APP_ID=your-app-id
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build locally
- `npm run deploy`: Deploy to GitHub Pages
- `npm run lint`: Run ESLint

## Deployment

### GitHub Pages Deployment
The application is configured for deployment to GitHub Pages:
1. Build the application: `npm run build`
2. Deploy to GitHub Pages: `npm run deploy`

### Firebase Configuration
Ensure Firebase security rules are properly configured for production use.

## Testing

### Manual Testing
The application includes several test pages:
- `StarRatingTest.jsx`: For testing star rating component
- `CouponTest.jsx`: For testing coupon functionality

### Browser Testing
The application should be tested across different browsers and devices to ensure responsive design works correctly.

## Performance Considerations

### Image Handling
- Images are currently stored as base64 encoded strings in Firestore
- This approach has size limitations and may impact performance
- Consider migrating to Firebase Storage for better performance

### Data Loading
- Implement pagination for large datasets
- Use Firestore indexes for optimized queries
- Implement loading states for better UX

## Security Considerations

### Firebase Security Rules
- Properly configure Firestore security rules to prevent unauthorized access
- Restrict write operations to authenticated users
- Implement role-based access controls in security rules

### Data Validation
- Validate all user inputs on both client and server side
- Sanitize user-generated content to prevent XSS attacks

### Authentication
- Use secure password policies
- Implement proper session management
- Protect admin routes with strong authorization checks

## Troubleshooting

### Common Issues

1. **Firebase Configuration Errors**
   - Ensure all environment variables are correctly set in `.env`
   - Verify Firebase project settings and credentials

2. **Authentication Issues**
   - Check Firebase Authentication providers are enabled
   - Verify user roles are correctly assigned in Firestore

3. **Payment Processing Issues**
   - Ensure PayPal client ID is correctly configured
   - Check currency conversion rates

4. **Performance Issues**
   - Optimize image sizes and formats
   - Implement pagination for large datasets
   - Review Firestore query efficiency

### Debugging Tips
- Use browser developer tools to inspect network requests
- Check browser console for JavaScript errors
- Enable Firebase debugging for detailed logs
- Use React DevTools to inspect component state