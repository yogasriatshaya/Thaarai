# Critical Issues - Quick Reference

## 🔴 CRITICAL SECURITY ISSUES (Fix Immediately)

### Issue #1: Missing .env Configuration
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 30 min  
**Files:** 
- backend/.env (create)
- frontend/.env.local (create)
- admin/.env.local (create)

**Required Variables:**
```
Backend:
- MONGODB_URI=mongodb://...
- JWT_SECRET=your-secret-key
- ADMIN_EMAIL=admin@example.com
- ADMIN_PASSWORD=Admin@123
- STRIPE_SECRET_KEY=sk_...
- RAZORPAY_KEY_ID=...
- RAZORPAY_KEY_SECRET=...
- CLOUDINARY_CLOUD_NAME=...
- CLOUDINARY_API_KEY=...
- CLOUDINARY_API_SECRET=...
- FRONTEND_URL=http://localhost:5173
- PORT=5001

Frontend:
- VITE_API_URL=http://localhost:5001/api
- VITE_BACKEND_URL=http://localhost:5001

Admin:
- VITE_API_URL=http://localhost:5001/api
- VITE_BACKEND_URL=http://localhost:5001
```

---

### Issue #2: Hardcoded Admin Authentication
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 2 hours  
**Files:** backend/routes/auth.js (lines 46-52)  
**Current Code:**
```javascript
if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD)
```
**Problems:**
- No rate limiting on attempts
- No admin user database record
- Same credentials for all environments
- No password hashing

**Fix:**
1. Remove hardcoded check
2. Create admin user in DB with hashed password
3. Reference User model for admin auth
4. Add rate limiting middleware
5. Add login attempt tracking

---

### Issue #3: Permissive CORS Configuration
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 15 min  
**File:** backend/server.js (line 11)  
**Current Code:**
```javascript
app.use(cors());
```
**Fix:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### Issue #4: Unvalidated Order Amounts
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 1.5 hours  
**Files:** 
- backend/routes/orders.js (lines 10-15, 100-137)
- backend/routes/coupons.js (lines 51-72)

**Problem:** Client sends totalAmount, backend trusts it  
**Exploit:** User can submit order with amount = $0.01  

**Fix:**
```javascript
// Backend order creation
// 1. Recalculate totals from cart items
// 2. Fetch product prices from DB
// 3. Verify total matches cart*taxes*shipping

const verifyOrderTotal = async (items, country, couponDiscount) => {
  let calculatedTotal = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId);
    const price = country === 'US' ? product.priceUSD : product.price;
    calculatedTotal += price * item.quantity;
  }
  
  // Add tax and shipping
  const tax = calculatedTotal * (settings.taxPercentage / 100);
  const shipping = calculatedTotal > settings.freeShippingThreshold ? 0 : settings.shippingFee;
  const discount = couponDiscount || 0;
  
  const finalTotal = calculatedTotal + tax + shipping - discount;
  
  // Verify within 1% tolerance (rounding errors)
  if (Math.abs(finalTotal - proposedTotal) > Math.ceil(finalTotal * 0.01)) {
    throw new Error('Order total mismatch');
  }
  
  return { calculatedTotal, tax, shipping, finalTotal };
};
```

---

### Issue #5: Stock Deducted Before Payment
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 2.5 hours  
**Files:** backend/routes/orders.js (3 places)

**Problem Flow:**
1. User creates order → stock deducted ✗
2. User pays in Stripe/Razorpay → success, but...
3. If webhook fails or payment fails → no stock restoration

**Current Code (WRONG):**
```javascript
// Line 19-44 in /create endpoint
const order = await Order.create({...});
// Then immediately deduct stock
for (const item of items) {
  await Product.findByIdAndUpdate(item.productId, { 
    $inc: { stock: -item.quantity } 
  });
}
```

**Fix Pattern:**
```javascript
// /create endpoint - DO NOT DEDUCT STOCK
const order = await Order.create({
  orderStatus: 'pending',  // Mark as pending payment
  paymentStatus: 'pending'
  // NO STOCK DEDUCTION HERE
});

// Stripe/Razorpay endpoint - CREATE ORDER ONLY
// Send to payment gateway, don't deduct stock

// WEBHOOK - DEDUCT STOCK (e.g., /orders/stripe-webhook)
router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const order = await Order.findOne({ stripeSessionId: session.id });
    
    if (order && order.orderStatus === 'pending') {
      // NOW deduct stock
      for (const item of order.items) {
        const prod = await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        
        // Create stock log
        await StockLog.create({
          productId: item.productId,
          action: 'decrement',
          quantity: item.quantity,
          reason: 'Payment Confirmed'
        });
        
        // Update order
        await Order.findByIdAndUpdate(order._id, {
          orderStatus: 'processing',
          paymentStatus: 'paid'
        });
      }
    }
  }
  
  res.json({received: true});
});
```

---

### Issue #6: No Webhook Signature Verification
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 2 hours  
**Files:** Missing webhook endpoints

**Problem:** Webhooks aren't verified, anyone can fake payment notifications  

**Add these endpoints:**
- POST `/api/webhooks/stripe`
- POST `/api/webhooks/razorpay`  
- POST `/api/webhooks/verify`

Example:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Handle verified event
    // Update order status, deduct stock, etc.
  } catch (err) {
    return res.status(400).send(`Webhook Error`);
  }
  
  res.json({received: true});
});
```

---

### Issue #7: Missing Rate Limiting
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 1 hour  
**Files:** backend/server.js, backend/routes/auth.js

**Add:**
```javascript
const rateLimit = require('express-rate-limit');

// Limit login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, try again later'
});

// Limit registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  skipSuccessfulRequests: true
});

router.post('/login', loginLimiter, async (req, res) => { ... });
router.post('/register', registerLimiter, async (req, res) => { ... });
router.post('/admin/login', loginLimiter, async (req, res) => { ... });
```

---

### Issue #8: No Regex Injection Protection
**Status:** Not Started  
**Priority:** CRITICAL  
**Time:** 1.5 hours  
**Files:** backend/routes/products.js (multiple lines)

**Current Code (VULNERABLE):**
```javascript
query.category = { $regex: new RegExp(`^${category}$`, 'i') };
```

**Attacker Input:** category = `.*` → Returns all products  

**Fix:**
```javascript
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Or use string comparison instead:
query.category = category; // Exact match instead of regex

// If you need case-insensitive:
query.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
```

---

## 🟠 HIGH PRIORITY FOLLOW-UPS

### Issue #9: Weak Token Storage (localStorage → httpOnly Cookie)
**Time:** 2 hours  
**Impact:** Easy XSS token theft

### Issue #10: No Payment Idempotency
**Time:** 1 hour  
**Impact:** Duplicate charges on webhook retry

### Issue #11: No Input Validation on Passwords
**Time:** 30 min  
**Impact:** Weak user passwords

### Issue #12: Missing Sensitive Data Encryption
**Time:** 2 hours  
**Impact:** GDPR/CCPA violations

---

## 🎯 TESTING PRIORITY

After fixes, test these scenarios:

```
1. CREATE ORDER WITHOUT PAYMENT
   - Create order → verify stock NOT deducted
   - Abandon payment → verify order stays pending
   
2. DOUBLE ORDER SUBMISSION
   - Send identical orders simultaneously
   - Verify stock only decreases by item.quantity (not 2x)
   
3. WEBHOOK REPLAY
   - Send same webhook twice
   - Verify order processed only once
   
4. INVALID AMOUNTS
   - POST order with totalAmount=$0.01
   - Verify rejected with 400 error
   
5. CURRENCY CONVERSION
   - Switch countries mid-checkout
   - Verify prices recalculate correctly
   
6. CONCURRENT STOCK
   - 10 simultaneous orders for product with 5 units
   - Verify only 5 succeed, others get out-of-stock
```

---

## 📅 IMPLEMENTATION TIMELINE

**Day 1 (Priority 1-4):**
- [ ] Create .env files - 30 min
- [ ] Fix CORS - 15 min
- [ ] Fix order validation - 1.5 hours
- [ ] Implement webhooks - 2.5 hours
- [ ] Add rate limiting - 1 hour

**Day 2 (Priority 5-8):**
- [ ] Fix stock deduction timing - 2 hours
- [ ] Add webhook verification - 1.5 hours
- [ ] Implement token refresh - 1.5 hours
- [ ] Add input validation - 1 hour

**Day 3:**
- [ ] Security testing
- [ ] Performance testing  
- [ ] Load testing concurrent orders

**Week 2:**
- [ ] Remaining high/medium issues
- [ ] Unit tests
- [ ] Integration tests

---

**Generated:** April 1, 2026  
**Update this document as issues are fixed**
