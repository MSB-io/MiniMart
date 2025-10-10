# MiniMart MVP

A complete multivendor marketplace called MiniMart, built with HTML, Tailwind CSS, JavaScript, and Firebase as Backend-as-a-Service.

## Live Demo

You can access the live demo here: https://mvoms3.web.app/

## Features

### ✅ User Management

- **Customer Registration/Login** - Complete authentication system
- **Vendor Registration/Login** - Separate vendor onboarding flow
- **Admin Dashboard** - Platform management interface
- **Role-based Access Control** - Different interfaces for customers, vendors, and admins

### ✅ Product Management

- **Product Listing** - Vendors can add, edit, and delete products
- **Product Search** - Search and filtering functionality
- **Product Details** - Images, descriptions, pricing, and stock management
- **Image Upload** - Firebase Storage integration for product images

### ✅ Order Management

- **Shopping Cart** - Add/remove items from multiple vendors
- **Checkout Process** - Single checkout for multi-vendor orders
- **Order Tracking** - Real-time order status updates
- **Order History** - Complete order management for customers and vendors
- **Inventory Management** - Automatic stock updates

## Technology Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Icons**: Font Awesome 6
- **Responsive Design**: Mobile-first approach

## Project Structure

```
multivendor-marketplace/
├── index.html                 # Main application file
├── pages/
│   └── admin-dashboard.html   # Admin dashboard
├── js/
│   ├── firebase-config.js     # Firebase configuration
│   ├── auth.js               # Authentication functions
│   ├── products.js           # Product management
│   ├── cart.js               # Shopping cart functionality
│   ├── orders.js             # Order management
│   └── app.js                # Main application logic
└── README.md                 # This file
```

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable the following services:

   - **Authentication** (Email/Password provider)
   - **Firestore Database** (Start in test mode)
   - **Storage** (Start in test mode)

4. Get your Firebase configuration:

   - Go to Project Settings → General → Your apps
   - Copy the Firebase SDK configuration

5. Update `js/firebase-config.js` with your configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};
```

### 2. Firestore Security Rules

Update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && resource.data.role == 'vendor';
    }

    // Products can be read by anyone, written by vendors
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null &&
        (request.auth.uid == resource.data.vendorId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }

    // Orders can be read/written by customers and vendors
    match /orders/{orderId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.customerId ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['vendor', 'admin']);
    }

    // Categories can be read by anyone, written by admins
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3. Storage Security Rules

Update your Storage security rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Running the Application

1. Clone or download the project files
2. Update the Firebase configuration in `js/firebase-config.js`
3. Open `index.html` in a web browser

## User Roles

### Customer

- Browse and search products
- Add products to cart
- Place orders
- Track order status
- View order history

### Vendor

- Add/edit/delete products
- Manage inventory
- View and manage orders
- Update order status
- View sales analytics

### Admin

- Manage users and vendors
- View all orders and products
- Access comprehensive analytics


## Key Features Explained

### Authentication System

- Secure email/password authentication
- Role-based access control
- User profile management

### Product Management

- Image upload with Firebase Storage
- Stock tracking and management
- Search functionality

### Shopping Cart

- Multi-vendor cart support
- Real-time stock validation
- Quantity management

### Order System

- Single checkout for multiple vendors
- Order status tracking
- Automatic inventory updates

### Responsive Design

- Mobile-first approach
- Tailwind CSS framework
- Modern UI/UX design
- Cross-browser compatibility

## License

This project is open source and available under the [MIT License](LICENSE).

**Note**: Remember to update your Firebase configuration before running the application. The default configuration will not work without your actual Firebase project credentials.
