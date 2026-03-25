# Thaarai — Luxury Fashion E-Commerce Platform

A full-stack luxury fashion e-commerce platform built with React, Node.js, and MongoDB.

---

## Project Structure

```
thaarai/
├── frontend/     → React + Vite (Port 5173)
├── admin/        → React Admin Panel (Port 5174)
└── backend/      → Node.js + Express (Port 4000)
```

---

## Prerequisites

- Node.js v18+
- MongoDB (local via MongoDB Compass)
- npm or yarn

---

## Setup Instructions

### 1. Start MongoDB

Open **MongoDB Compass** and connect to:
```
mongodb://localhost:27017
```
Create a database called `thaarai` (it will auto-create on first use).

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` with your keys:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/thaarai
JWT_SECRET=thaarai_luxury_jwt_secret_2024
STRIPE_SECRET_KEY=sk_test_your_stripe_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
ADMIN_EMAIL=admin@thaarai.com
ADMIN_PASSWORD=Admin@123
```

Start the backend:
```bash
npm run dev
```

Backend runs at: **http://localhost:4000**

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 4. Admin Panel Setup

```bash
cd admin
npm install
npm run dev
```

Admin runs at: **http://localhost:5174**

Admin credentials:
- Email: `admin@thaarai.com`
- Password: `Admin@123`

---

## Features

### Frontend (localhost:5173)
- **Home Page** — Hero banner, featured collection, brand story, newsletter
- **Collection Page** — Filter by category, material, price range; sort options
- **Product Detail Page** — Image gallery, size/color selector, reviews, related products
- **Cart** — Full cart management with quantity controls
- **Checkout** — Stripe, Razorpay, Cash on Delivery
- **Auth** — Register/Login with JWT
- **Orders** — View order history and status

### Admin (localhost:5174)
- **Dashboard** — Stats (products, orders, customers, revenue), recent orders
- **Products** — Add, edit, delete products with multiple image upload
- **Orders** — View all orders, update order status (Processing → Shipped → Delivered)
- **Customers** — View all registered customers

---

## Payment Integration

### Stripe
1. Get keys from https://dashboard.stripe.com
2. Add `STRIPE_SECRET_KEY` to backend `.env`
3. Add `VITE_STRIPE_PUBLIC_KEY` to frontend `.env`

### Razorpay
1. Get keys from https://dashboard.razorpay.com
2. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to backend `.env`
3. Add Razorpay script to frontend `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Cash on Delivery
Works out of the box — no configuration needed.

---

## Image Upload

- Images are uploaded via Multer to `/backend/uploads/`
- Accessed via: `http://localhost:4000/uploads/filename.jpg`
- Supports: JPG, PNG, WEBP, GIF (max 10MB each)

---

## Database Schema

### Products
```
name, description, category, subcategory, price, sizes[], colors[], 
images[], stock, bestseller, label, material, heritage, reviews[], 
averageRating, reviewCount
```

### Orders
```
userId, items[], address{}, totalAmount, paymentMethod, paymentStatus,
orderStatus, stripeSessionId, razorpayOrderId
```

### Users
```
name, email, password (hashed), role, wishlist[], cartData{}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/admin/login | Admin login |
| GET | /api/products | Get products (with filters) |
| GET | /api/products/:id | Get single product |
| POST | /api/products | Add product (admin) |
| PUT | /api/products/:id | Update product (admin) |
| DELETE | /api/products/:id | Delete product (admin) |
| GET | /api/cart | Get cart |
| POST | /api/cart/add | Add to cart |
| PUT | /api/cart/update | Update cart qty |
| DELETE | /api/cart/remove | Remove from cart |
| POST | /api/orders/create | Create COD order |
| POST | /api/orders/stripe | Stripe checkout |
| POST | /api/orders/razorpay | Razorpay checkout |
| GET | /api/orders/my-orders | User orders |
| GET | /api/orders/all | All orders (admin) |
| PUT | /api/orders/:id/status | Update order status |
| GET | /api/users/all | All users (admin) |

---

## Running All Three Simultaneously

Open 3 terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

**Terminal 3 — Admin:**
```bash
cd admin && npm run dev
```
