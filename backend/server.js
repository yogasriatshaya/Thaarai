const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');

dotenv.config({ override: true });
connectDB();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// SECURITY: Rate Limiting Middleware
// ============================================

// Registration rate limiter - 5 attempts per 15 minutes
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1'
});

// Login rate limiter - 10 attempts per 15 minutes per IP
const loginLimiterIP = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this IP, try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1'
});

// Login rate limiter - 5 attempts per 15 minutes per email
const loginLimiterEmail = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts for this email account',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.email || req.ip,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1'
});

// Password reset rate limiter - 5 attempts per hour
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset attempts, try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.email || req.ip,
  skip: (req) => req.ip === '::1' || req.ip === '127.0.0.1'
});

// OTP verification rate limiter - 5 attempts per minute
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many OTP verification attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.email || req.ip
});

// ============================================
// SECURITY: CSRF Protection (optional, in production)
// ============================================
const csrfProtection = csrf({ cookie: false });

// ============================================
// CUSTOM MIDDLEWARE: Attach rate limiters to routes
// ============================================
app.use((req, res, next) => {
  if (req.path === '/api/auth/register' && req.method === 'POST') {
    return registrationLimiter(req, res, next);
  }
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    return loginLimiterIP(req, res, () => loginLimiterEmail(req, res, next));
  }
  if (req.path === '/api/auth/forgot-password' && req.method === 'POST') {
    return resetLimiter(req, res, next);
  }
  if (req.path === '/api/auth/reset-password' && req.method === 'POST') {
    return resetLimiter(req, res, next);
  }
  if (req.path === '/api/auth/verify-otp' && req.method === 'POST') {
    return otpLimiter(req, res, next);
  }
  next();
});

// Routes
app.get('/api', (req, res) => res.json({ success: true, status: "online", message: "Thaarai API is operational" }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/banners', require('./routes/banners'));

app.get('/', (req, res) => res.send('Thaarai Designer Studio API Running'));


// ============================================
// ERROR HANDLING for Rate Limit
// ============================================
app.use((err, req, res, next) => {
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: err.message,
      retryAfter: err.retryAfter
    });
  }
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      success: false,
      message: 'Security token validation failed'
    });
  }
  next(err);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));
