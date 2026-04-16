# Thaarai E-Commerce Platform — Project Analysis

## Overview
**Thaarai** is a full-stack luxury fashion e-commerce platform with three separate applications (Frontend, Admin, Backend) orchestrated via Docker. The platform supports multi-region operations (India/USA), multi-currency pricing, and advanced inventory management.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Port 5173)                      │
│              React 18 + Vite + Tailwind CSS                 │
│          Customer-facing e-commerce storefront              │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Port 5001)                   │
│             Node.js/Express + Mongoose + MongoDB            │
│           (Stripe/Razorpay payments, Cloudinary CDN)        │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│                   Admin Dashboard (Port 5174)                │
│               React 18 + Vite + Tailwind CSS                │
│      Product/Order/Inventory/User Management Interface      │
└─────────────────────────────────────────────────────────────┘

Database: MongoDB (containerized)
File Storage: Cloudinary CDN (images)
Payment: Stripe + Razorpay
Email: Nodemailer
```

---

## Technology Stack

### Backend
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB 7.1.0 (Mongoose 8.0.3 ODM)
- **Authentication**: JWT (jsonwebtoken 9.0.2), bcryptjs
- **File Upload**: Multer + Cloudinary (CDN storage)
- **Payment Integration**: Stripe 14.10.0, Razorpay 2.9.2
- **Email**: Nodemailer 8.0.3
- **Validation**: Validator.js 13.11.0
- **CORS**: Enabled for cross-origin frontend requests

### Frontend (Customer)
- **Framework**: React 18.2.0 + Vite 5.0.8
- **Styling**: Tailwind CSS 3.4.0 + PostCSS
- **Routing**: React Router DOM 6.21.1
- **HTTP Client**: Axios 1.6.2
- **Payments**: Stripe.js 2.3.0
- **Notifications**: React Toastify 10.0.4

### Admin Panel
- **Framework**: React 18.2.0 + Vite 5.0.8
- **Styling**: Tailwind CSS 3.4.0
- **Charts**: Recharts 3.8.0
- **UI Icons**: Lucide React 0.577.0
- **Data Export**: Jspdf 4.2.1 (PDF), XLSX 0.18.5 (Excel)
- **Image Cropping**: React Easy Crop 5.5.7
- **HTTP Client**: Axios 1.6.2

### DevOps
- **Containerization**: Docker (3 separate images)
- **Orchestration**: Docker Compose 3.8
- **Reverse Proxy**: Nginx (frontend/admin containers)
- **Health Checks**: MongoDB ping monitoring

---

## Database Models (MongoDB Collections)

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **User** | Customer accounts | email, password_hash, cart, wishlist, addresses |
| **Product** | Inventory items | name, price, variants (color+images), stock, reviews, multi-currency pricing |
| **Order** | Purchase records | items, total, payment_status, shipping_address, order_date |
| **Category** | Product classification | name, icon, subcategories |
| **Coupon** | Discount codes | code, discount%, validity_dates, usage_limits |
| **Banner** | Promotional campaigns | title, image, display_duration |
| **Settings** | Global configuration | maintenance_mode, tax_rates, shipping_costs |
| **StockLog** | Inventory audit trail | product_id, quantity_change, timestamp |
| **PendingUser** | Unverified registrations | email, temp_code, created_at |

---

## API Endpoints (11 Route Modules)

### 1. **Authentication** (`/api/auth`)
- `POST /register` — Create new user account
- `POST /login` — User login (returns JWT)
- `POST /admin-login` — Admin authentication
- `POST /logout` — Session termination
- `POST /verify-email` — Email verification
- `POST /refresh-token` — Token renewal

### 2. **Products** (`/api/products`)
- `GET /` — List products (with pagination, filters)
- `GET /:id` — Get product details
- `POST /` — Create product (admin-only)
- `PUT /:id` — Update product
- `DELETE /:id` — Delete product
- `POST /:id/reviews` — Add product review

### 3. **Cart** (`/api/cart`)
- `GET /` — Get user's cart
- `POST /add` — Add item to cart
- `PUT /update` — Update quantity
- `DELETE /remove` — Remove from cart
- `DELETE /clear` — Clear entire cart

### 4. **Orders** (`/api/orders`)
- `POST /` — Create order (processes payment)
- `GET /` — Get user's order history
- `GET /:id` — Get order details
- `PUT /:id/status` — Update order status (admin)
- `POST /:id/cancel` — Cancel order

### 5. **Users** (`/api/users`)
- `GET /profile` — Get user profile
- `PUT /profile` — Update user info
- `POST /address` — Add shipping address
- `GET /orders` — User's order history

### 6. **Dashboard** (`/api/dashboard`)
- `GET /stats` — Revenue, orders, customers metrics
- `GET /recent-orders` — Latest orders
- `GET /sales-chart` — Sales data by period
- `GET /inventory-summary` — Stock overview

### 7. **Inventory** (`/api/inventory`)
- `GET /` — All products with stock levels
- `PUT /:id/stock` — Adjust stock quantity
- `GET /low-stock` — Products below threshold
- `GET /logs` — Stock change history

### 8. **Coupons** (`/api/coupons`)
- `GET /` — List active coupons
- `POST /` — Create coupon (admin)
- `PUT /:id` — Edit coupon
- `DELETE /:id` — Delete coupon
- `POST /validate` — Verify coupon validity

### 9. **Categories** (`/api/categories`)
- `GET /` — List all categories
- `POST /` — Create category (admin)
- `PUT /:id` — Edit category
- `DELETE /:id` — Delete category

### 10. **Settings** (`/api/settings`)
- `GET /` — Get platform settings
- `PUT /` — Update settings (admin)
- `PUT /maintenance` — Toggle maintenance mode

### 11. **Banners** (`/api/banners`)
- `GET /` — Active promotional banners
- `POST /` — Create banner (admin)
- `PUT /:id` — Update banner
- `DELETE /` — Delete banner

---

## Frontend Features

### Customer Portal (localhost:5173)
1. **Home Page**
   - Hero banner with featured collections
   - Brand story section
   - Newsletter signup
   - Product categories grid

2. **Product Catalog**
   - Collection browsing with filters (category, price, material, rating)
   - Sorting options (price, newest, bestsellers)
   - Pagination for large datasets

3. **Product Details**
   - Image gallery (multiple colors/variants)
   - Size & color selector
   - Customer reviews & ratings
   - Related products carousel
   - Add to cart / wishlist

4. **Shopping Experience**
   - Cart management (quantity, remove items)
   - Wishlist saving
   - Coupon code application
   - Checkout flow with address entry
   - Payment gateway (Stripe/Razorpay)

5. **User Accounts**
   - Registration & login
   - Order history tracking
   - Saved addresses
   - Wishlist management
   - Profile editing

6. **Additional Features**
   - Exit-intent popup (retention)
   - Recently viewed products
   - Scroll-to-top button
   - Currency switcher (INR/USD)
   - Newsletter subscription
   - Country-specific availability
   - Order tracking page
   - Mobile-responsive design

---

## Admin Dashboard (localhost:5174)

### Core Modules

| Module | Capabilities |
|--------|--------------|
| **Dashboard** | Sales metrics, order summaries, revenue charts, quick actions |
| **Products** | Create/edit/delete, bulk operations, image management, pricing, variants |
| **Orders** | View all orders, update status, track shipment, manage refunds |
| **Inventory** | Stock levels, low-stock alerts, stock movement logs, adjustments |
| **Customers** | User list, purchase history, contact info, segmentation |
| **Coupons** | Create discount codes, set validity, usage limits, bulk operations |
| **Categories** | Manage product categories, subcategories, icons |
| **Banners** | Create promotional campaigns, scheduling, image uploads |
| **Settings** | Maintenance mode, tax configuration, shipping costs, general settings |

### Admin Capabilities
- Export data to PDF/Excel
- Real-time charts (Recharts)
- Image cropping & editing
- Bulk product uploads
- Multi-currency admin pricing
- User type management
- Stock audit logs

---

## Multi-Region & Multi-Currency Features

### Supported Markets
- **India**: 
  - Currency: INR
  - Pricing fields: `price`, `priceUSD`, `originalPrice`
  - Limited-time offers: `offerActiveIndia`, `offerPriceIndia`
  - Availability flag: `availableInIndia`

- **USA**:
  - Currency: USD
  - Pricing fields: `priceUSD`, `originalPriceUSD`, `costPriceUSD`
  - Limited-time offers: `offerActiveUSA`, `offerPriceUSDUSA`
  - Availability flag: `availableInUS`

### Currency Switcher
- Front-end context (`CurrencyContext.jsx`)
- Dynamically displays prices in selected currency
- Regional availability filtering

---

## Deployment & Containerization

### Docker Stack
```yaml
mongo:
  - Latest MongoDB image
  - Volume: mongo-data
  - Health check activated
  - Network: thaarai-network

backend:
  - Node.js + Express app
  - Image: cubeaidocker/thaarai-backend:latest
  - Port: 5001 (internal 5001 → external 5001)
  - Depends on: MongoDB (healthy)
  - Volumes: uploads-data

frontend:
  - Nginx-served React SPA
  - Image: cubeaidocker/thaarai-frontend:latest
  - Port: 5173 (internal 80 → external 5173)
  - Depends on: Backend

admin:
  - Nginx-served React SPA
  - Image: cubeaidocker/thaarai-admin:latest
  - Port: 5174 (internal 80 → external 5174)
  - Depends on: Backend

Storage:
- mongo-data: MongoDB persistence
- uploads-data: Backend file uploads
- Network: thaarai-network (all services connected)
```

### Dockerfiles Present
- `backend/Dockerfile` — Node.js runtime
- `frontend/Dockerfile` — Nginx reverse proxy
- `admin/Dockerfile` — Nginx reverse proxy

### Health Monitoring
- MongoDB ping healthcheck (10s interval)
- Backend/Frontend dependency on healthy MongoDB
- Automatic restart on failure

---

## Utility Scripts

### Located in `/root`
| Script | Purpose |
|--------|---------|
| `fixStock.js` | Inventory reconciliation |
| `check_db.js` | Database integrity checks |
| `check_orders.js` | Order validation |
| `check_products.js` | Product data consistency |
| `check_status.js` | Service health check |
| `debug_db.js` | MongoDB debugging |
| `fix_orders.js` | Order error resolution |
| `test_api.js` | API endpoint testing |
| `test_env.js` | Environment variable validation |

### Backend Scripts (in `/scripts`)
- `cleanup_images.js` — Remove orphaned uploads
- `migrate_prices.js` — Price recalculation
- `seed_categories.js` — Bootstrap default categories

### Configuration Scripts
- `seedAdmin.js` — Create initial admin user
- `seedCategories.js` — Populate default categories
- `seedProducts.js` — Load mock product data (commented out)

---

## Current Port Configuration

| Service | Local Port | Container Port | Access URL |
|---------|-----------|-----------------|-----------|
| Frontend | 5173 | 80 | http://localhost:5173 |
| Admin | 5174 | 80 | http://localhost:5174 |
| Backend API | 5001 | 5001 | http://localhost:5001 |
| MongoDB | 27017 | 27017 | mongodb://localhost:27017 |

---

## Key Environment Variables

```env
# Backend (.env required)
PORT=5001
MONGODB_URI=mongodb://mongo:27017/thaarai
JWT_SECRET=thaarai_luxury_jwt_secret_2024

# Payment Processors
STRIPE_SECRET_KEY=sk_test_...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...

# File Upload
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=app-password

# Admin Credentials
ADMIN_EMAIL=admin@thaarai.com
ADMIN_PASSWORD=Admin@123
```

---

## Security Features

1. **Authentication**
   - JWT-based (stateless, secure)
   - Password hashing (bcryptjs)
   - Email verification for new users
   - Refresh token mechanism

2. **Payment Security**
   - Stripe PCI compliance
   - Razorpay tokenization
   - Server-side validation

3. **File Upload**
   - Multer middleware validation
   - Cloudinary CDN storage (no local exposure)

4. **CORS**
   - Enabled on backend for cross-origin requests

5. **Environment Variables**
   - Sensitive keys stored in `.env`
   - Loaded via dotenv with override protection

---

## File Structure Overview

```
Deploy/
├── docker-compose.yml          # Orchestration definition
├── fixStock.js                 # Utility scripts
├── README.md                   # Setup instructions
├── backend/                    # Node.js/Express API
│   ├── server.js              # Main entry point
│   ├── package.json           # Dependencies
│   ├── Dockerfile             # Container definition
│   ├── config/                # Database & seed configs
│   ├── models/                # Mongoose schemas (9 models)
│   ├── routes/                # API endpoint handlers (11 modules)
│   ├── middleware/            # Auth & upload handlers
│   ├── utils/                 # Helper functions (email, etc)
│   └── public/uploads/        # Temporary file storage
├── frontend/                  # React customer portal
│   ├── src/
│   │   ├── App.jsx           # Main app & routing
│   │   ├── main.jsx          # React entry point
│   │   ├── context/          # CurrencyContext, ShopContext
│   │   ├── pages/            # Route pages (Home, Cart, Checkout, etc)
│   │   ├── components/       # Reusable UI components
│   │   ├── assets/           # Images, icons
│   │   └── api.js            # API client config
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf            # Reverse proxy config
│   └── index.html
└── admin/                     # React admin dashboard
    ├── src/
    │   ├── App.jsx           # Admin routing
    │   ├── pages/            # Dashboard, Products, Orders, etc
    │   ├── components/       # Modals, forms, charts
    │   └── api.js            # API client config
    ├── package.json
    ├── vite.config.js
    ├── nginx.conf
    └── index.html
```

---

## Performance & Scalability Considerations

### Current Strengths
✅ Modular microservice-like architecture (frontend/admin/backend separate)  
✅ Docker containerization (easy horizontal scaling)  
✅ Cloudinary CDN for image distribution  
✅ Vite for fast frontend builds  
✅ MongoDB for flexible schema  
✅ Stateless API (JWT-based, no session storage)  

### Potential Improvements
⚠️ Add Redis caching for frequently accessed data  
⚠️ Implement pagination limits on large queries  
⚠️ Add database indexing on frequently searched fields  
⚠️ Consider API rate limiting  
⚠️ Add request validation middleware  
⚠️ Implement image optimization pipeline  
⚠️ Add comprehensive error logging (e.g., Winston, Sentry)  

---

## Testing & Debugging

### Available Test Scripts
- Backend: `test_api.js`, `test_env.js`
- Utilities: `check_db.js`, `check_orders.js`, `check_products.js`, `debug_db.js`

### Development Mode
```bash
Backend:  npm run dev (nodemon)
Frontend: npm run dev (Vite dev server)
Admin:    npm run dev (Vite, port 5174)
```

### Production Build
```bash
Frontend: npm run build (creates dist/)
Admin:    npm run build (creates dist/)
Backend:  NODE_ENV=production npm start
```

---

## Known Issues & Utility Scripts Analysis

The presence of multiple debugging/fixing scripts suggests these common issues were encountered:
- **fixStock.js** — Inventory synchronization problems
- **fix_orders.js** — Order status/payment reconciliation
- **migrate_prices.js** — Price calculation errors
- **cleanup_images.js** — Orphaned file management

These should be run periodically or integrated into admin workflows.

---

## Recommendations

### Immediate Actions
1. ✅ Review `.env` configuration completeness
2. ✅ Run health checks via `check_status.js`
3. ✅ Seed initial category/admin data
4. ✅ Test payment processors (Stripe/Razorpay integration)
5. ✅ Validate Cloudinary setup

### Short-term Improvements
1. Add comprehensive API documentation (Swagger/OpenAPI)
2. Implement API request/response logging
3. Add auth token expiration management
4. Set up monitoring dashboards
5. Create automated backup strategy

### Long-term Architecture
1. Consider microservice containerization per route module
2. Add GraphQL as alternative to REST API
3. Implement webhooks for payment events
4. Add real-time notifications (Socket.io)
5. Separate CMS from e-commerce logic
6. Add inventory reservation system
7. Implement order fulfillment pipeline

---

**Generated**: April 15, 2026 | **Project Name**: Thaarai Luxury Fashion E-Commerce Platform
