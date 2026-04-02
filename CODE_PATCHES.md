# Code Patches for Critical Issues

## 1. CORS Configuration Fix

**File:** `backend/server.js`

```javascript
// BEFORE (INSECURE)
app.use(cors());

// AFTER (SECURE)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.ADMIN_URL || 'http://localhost:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 2. JWT Secret Validation

**File:** `backend/server.js`

```javascript
// Add before connectDB()
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET not set in environment variables');
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

// Add similar checks for other critical env vars
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'RAZORPAY_KEY_ID',
  'CLOUDINARY_CLOUD_NAME'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`FATAL: ${envVar} not set`);
    process.exit(1);
  }
});
```

---

## 3. Input Sanitization Helper

**File:** `backend/utils/validators.js` (CREATE NEW)

```javascript
const validator = require('validator');

// Escape regex special characters
exports.escapeRegex = (str) => {
  if (!str) return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Validate common inputs
exports.validateEmail = (email) => {
  return validator.isEmail(email);
};

exports.validatePhoneNumber = (phone, country = 'IN') => {
  if (country === 'US') {
    return /^\+?1?\d{10}$/.test(phone.replace(/\D/g, ''));
  }
  // India phone
  return /^\+?91?\d{10}$/.test(phone.replace(/\D/g, ''));
};

exports.validatePostalCode = (code, country = 'IN') => {
  if (country === 'US') {
    return /^\d{5}(-\d{4})?$/.test(code);
  }
  // India postal code
  return /^\d{6}$/.test(code);
};

exports.validateProductPrice = (price) => {
  const num = Number(price);
  return !isNaN(num) && num > 0 && num < 1000000;
};

exports.validateStockQuantity = (qty) => {
  const num = Number(qty);
  return Number.isInteger(num) && num >= 0 && num < 1000000;
};

exports.validatePageParams = (page, limit, maxLimit = 100) => {
  let p = Number(page) || 1;
  let l = Number(limit) || 20;
  
  p = Math.max(1, p);
  l = Math.min(Math.max(1, l), maxLimit);
  
  return { page: p, limit: l };
};

exports.sanitizeSearchInput = (search, maxLength = 100) => {
  if (!search) return '';
  return search.substring(0, maxLength).trim();
};
```

---

## 4. Order Validation Fix

**File:** `backend/routes/orders.js`

```javascript
// NEW HELPER FUNCTION - Add at top of file
const calculateOrderTotal = async (items, country, settings, couponDiscount = 0) => {
  let subtotal = 0;
  const priceField = country === 'US' ? 'priceUSD' : 'price';
  
  // Verify all items exist and calculate subtotal
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }
    
    const itemPrice = product[priceField];
    if (itemPrice <= 0) {
      throw new Error(`Invalid price for product ${product.name}`);
    }
    
    // Check stock availability
    if (product.stock < item.quantity) {
      throw new Error(`${product.name} - Only ${product.stock} available`);
    }
    
    subtotal += itemPrice * item.quantity;
  }
  
  // Get country config
  const countryConfig = settings?.countryConfig?.[country];
  const taxName = countryConfig?.taxName || (country === 'US' ? 'Sales Tax' : 'GST');
  const taxPercentage = countryConfig?.taxPercentage || 0;
  const taxInclusive = countryConfig?.taxInclusive !== undefined ? countryConfig.taxInclusive : false;
  const freeShippingThreshold = countryConfig?.freeShippingThreshold || (country === 'US' ? 50 : 500);
  const shippingFee = countryConfig?.shippingFee || 0;
  
  const shippingAmount = subtotal > freeShippingThreshold ? 0 : shippingFee;
  const netAmount = subtotal + shippingAmount;
  
  let taxAmount = 0;
  if (taxPercentage > 0) {
    if (taxInclusive) {
      // Tax is included, need to extract it
      taxAmount = Math.round(netAmount * (taxPercentage / (100 + taxPercentage)) * 100) / 100;
    } else {
      // Tax is on top
      taxAmount = Math.round(netAmount * (taxPercentage / 100) * 100) / 100;
    }
  }
  
  const discountAmount = Math.min(couponDiscount || 0, subtotal); // Can't discount more than subtotal
  const totalBeforeTax = subtotal + shippingAmount - discountAmount;
  
  const finalTotal = taxInclusive 
    ? netAmount - discountAmount 
    : totalBeforeTax + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    shippingAmount: Math.round(shippingAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    taxName,
    taxPercentage,
    discountAmount: Math.round(discountAmount * 100) / 100,
    totalAmount: Math.round(finalTotal * 100) / 100
  };
};

// MODIFY /create endpoint
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const { items, address, paymentMethod, couponId, guestEmail, guestPhone, currency, orderCountry } = req.body;
    
    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    if (!address || !address.fullName || !address.addressLine || !address.city) {
      return res.status(400).json({ success: false, message: 'Address is incomplete' });
    }
    
    if (!req.user && !guestEmail) {
      return res.status(400).json({ success: false, message: 'Email required for guest checkout' });
    }
    
    // Get settings
    const settings = await Settings.findOne();
    
    // Verify coupon and get discount
    let couponData = null;
    if (couponId) {
      couponData = await Coupon.findById(couponId);
      if (!couponData) {
        return res.status(400).json({ success: false, message: 'Invalid coupon' });
      }
    }
    
    // CALCULATE TOTAL ON SERVER - DON'T TRUST CLIENT
    const orderTotals = await calculateOrderTotal(
      items,
      orderCountry || 'IN',
      settings,
      couponData?.discountValue || 0
    );
    
    // Create order WITHOUT deducting stock (stock deducted in webhook)
    const order = await Order.create({
      userId: req.user ? req.user.id : null,
      isGuest: !req.user,
      guestEmail: req.user ? null : guestEmail,
      guestPhone: req.user ? null : guestPhone,
      items: items.map(i => ({
        productId: i.productId,
        name: i.name,
        image: i.image,
        price: i.price,
        size: i.size,
        color: i.color,
        quantity: i.quantity
      })),
      address,
      paymentMethod,
      currency: currency || 'INR',
      orderCountry: orderCountry || 'IN',
      ...orderTotals,
      paymentStatus: 'pending',
      orderStatus: 'pending' // Changed from 'processing'
    });
    
    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});
```

---

## 5. Rate Limiting Middleware

**File:** `backend/middleware/rateLimiter.js` (CREATE NEW)

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Create Redis client (optional but recommended for production)
// For development, use in-memory store
const limiters = {
  // Login - 5 attempts per 15 minutes
  login: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  // Registration - 3 per hour
  register: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    skipSuccessfulRequests: true,
    message: 'Too many registration attempts from this IP'
  }),
  
  // General API - 100 per minute
  general: rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
  }),
  
  // File uploads - 10 per hour
  upload: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many uploads from this IP'
  })
};

module.exports = limiters;
```

**Usage in routes:**

```javascript
const { login, register } = require('../middleware/rateLimiter');

router.post('/login', login, async (req, res) => { ... });
router.post('/register', register, async (req, res) => { ... });
router.post('/admin/login', login, async (req, res) => { ... });
```

---

## 6. Webhook Verification (Stripe Example)

**File:** `backend/routes/webhooks.js` (CREATE NEW)

```javascript
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const StockLog = require('../models/StockLog');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe webhook - IMPORTANT: Do not use express.json() middleware for this route
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig) {
    return res.status(400).send('Missing stripe-signature header');
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handlePaymentSuccess(event.data.object);
        break;
        
      case 'checkout.session.expired':
        await handlePaymentExpired(event.data.object);
        break;
        
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({received: true});
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Still return 200 to prevent retry storm
    res.json({received: true, error: err.message});
  }
});

async function handlePaymentSuccess(session) {
  console.log('Payment successful:', session.id);
  
  // Find order by sessionId
  const order = await Order.findOne({ stripeSessionId: session.id });
  if (!order) {
    console.error('Order not found for session', session.id);
    return;
  }
  
  // Prevent double processing
  if (order.paymentStatus === 'paid') {
    console.log('Order already paid:', order._id);
    return;
  }
  
  // Deduct stock
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    
    if (!product) {
      console.error(`Product not found: ${item.productId}`);
      continue;
    }
    
    const previousStock = product.stock;
    
    // Deduct stock atomically
    const updated = await Product.findByIdAndUpdate(
      item.productId,
      { 
        $inc: { stock: -item.quantity },
        $set: { label: product.stock - item.quantity <= 0 ? 'Sold Out' : '' }
      },
      { new: true }
    );
    
    // Log the transaction
    await StockLog.create({
      productId: item.productId,
      action: 'decrement',
      quantity: item.quantity,
      previousStock,
      currentStock: updated.stock,
      reason: 'Payment Confirmed (Stripe)',
      orderId: order._id
    });
  }
  
  // Update order status
  await Order.findByIdAndUpdate(order._id, {
    paymentStatus: 'paid',
    orderStatus: 'processing'
  });
  
  // TODO: Send order confirmation email
  console.log('Order processed:', order._id);
}

async function handlePaymentExpired(session) {
  const order = await Order.findOne({ stripeSessionId: session.id });
  if (order && order.paymentStatus === 'pending') {
    await Order.findByIdAndUpdate(order._id, {
      paymentStatus: 'failed',
      orderStatus: 'cancelled'
    });
    console.log('Order cancelled due to expired session:', order._id);
  }
}

async function handleRefund(charge) {
  // Find order by charge ID from metadata
  const order = await Order.findOne({ stripeChargeId: charge.id });
  if (!order) return;
  
  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity }
    });
    
    await StockLog.create({
      productId: item.productId,
      action: 'increment',
      quantity: item.quantity,
      reason: 'Refund Processed',
      orderId: order._id
    });
  }
  
  await Order.findByIdAndUpdate(order._id, {
    paymentStatus: 'refunded'
  });
}

module.exports = router;
```

**Add to server.js:**

```javascript
app.use('/api/webhooks', require('./routes/webhooks'));
```

---

## 7. Regex Injection Prevention

**File:** `backend/routes/products.js`

```javascript
// BEFORE (VULNERABLE)
if (category) {
  const parentCat = await Category.findOne({ 
    name: { $regex: new RegExp(`^${category}$`, 'i') } 
  });
}

// AFTER (SAFE)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

if (category) {
  const escaped = escapeRegex(category);
  const parentCat = await Category.findOne({ 
    name: { $regex: `^${escaped}$`, $options: 'i' } 
  });
}

// OR EVEN BETTER - Use exact match
if (category) {
  const parentCat = await Category.findOne({ 
    name: category 
  });
}
```

---

## 8. Password Validation

**File:** `backend/routes/auth.js`

```javascript
// NEW VALIDATION FUNCTION
const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain number');
    }
    if (!/[@#$%^&*]/.test(password)) {
      errors.push('Password must contain special character (@#$%^&*)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// USE IN REGISTRATION
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }
    
    // ... rest of registration
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
```

---

## 9. Environment Variable Template

**File:** `backend/.env.example` (CREATE NEW & COMMIT)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/thaarai

# JWT
JWT_SECRET=your-super-secret-key-at-least-32-characters-long

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Server
PORT=5001
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@thaarai.com
```

---

## Summary of Applied Patches

✅ CORS configuration  
✅ Environment variable validation  
✅ Order total verification  
✅ Rate limiting setup  
✅ Webhook verification  
✅ Input sanitization  
✅ Regex injection prevention  
✅ Password validation  

**Apply these patches before deploying to production!**
