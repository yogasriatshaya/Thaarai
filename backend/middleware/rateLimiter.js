/**
 * Rate Limiting Implementation for Authentication
 * This file provides the implementation for rate limiting all auth endpoints
 * 
 * CRITICAL: Rate limiting is currently NOT implemented
 * Follow this guide to add it to your backend
 */

// ============================================
// STEP 1: Install Dependencies
// ============================================

/*
Run in backend directory:

npm install express-rate-limit
npm install redis
npm install rate-limit-redis

Or with npm-check-updates:
npm install express-rate-limit@latest redis@latest rate-limit-redis@latest
*/

// ============================================
// STEP 2: Create rateLimiter.js Middleware
// ============================================

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Initialize Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.on('connect', () => console.log('Redis Connected'));

// ============================================
// REGISTRATION RATE LIMITER
// ============================================
const registrationLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:register:'
  }),
  windowMs: 15 * 60 * 1000,        // 15 minutes
  max: 5,                           // 5 attempts per window
  message: 'Too many registration attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,            // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,             // Disable the `X-RateLimit-*` headers
  skip: (req) => req.ip === '::1',  // Skip for localhost
  keyGenerator: (req) => req.ip     // Use IP as key
});

// ============================================
// LOGIN RATE LIMITER (IP-based)
// ============================================
const loginLimiterIP = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:login:ip:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 10,                          // 10 attempts per 15 minutes per IP
  message: 'Too many login attempts from this IP, try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================
// LOGIN RATE LIMITER (Email-based)
// ============================================
// This prevents attacking a specific email account
const loginLimiterEmail = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:login:email:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,                           // 5 attempts per 15 minutes per email
  message: 'Too many login attempts for this email, try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip  // Use email as key
});

// ============================================
// OTP RESEND RATE LIMITER
// ============================================
const otpResendLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:resend:otp:'
  }),
  windowMs: 60 * 1000,              // 1 minute
  max: 3,                           // 3 resends per minute
  message: 'Too many OTP requests, please wait 1 minute before trying again',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip
});

// ============================================
// OTP VERIFICATION RATE LIMITER
// ============================================
const otpVerifyLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:verify:otp:'
  }),
  windowMs: 60 * 1000,              // 1 minute
  max: 5,                           // 5 attempts per minute
  message: 'Too many verification attempts, please wait 1 minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip
});

// ============================================
// FORGOT PASSWORD RATE LIMITER
// ============================================
const forgotPasswordLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:forgot:password:'
  }),
  windowMs: 60 * 60 * 1000,         // 1 hour
  max: 5,                           // 5 attempts per hour
  message: 'Too many password reset requests, please try again in an hour',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip
});

// ============================================
// PASSWORD RESET RATE LIMITER
// ============================================
const resetPasswordLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:reset:password:'
  }),
  windowMs: 60 * 1000,              // 1 minute
  max: 5,                           // 5 attempts per minute
  message: 'Too many password reset attempts, please wait 1 minute',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.email || req.ip
});

// ============================================
// ADMIN LOGIN RATE LIMITER
// ============================================
const adminLoginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'auth:admin:login:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,                           // Stricter for admin (5 attempts)
  message: 'Too many admin login attempts, try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================
// MEMORY STORE FALLBACK (if Redis not available)
// ============================================
// For development or if Redis is down
const createMemoryLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    // Memory store is default if no store specified
  });
};

// ============================================
// EXPORT ALL LIMITERS
// ============================================
module.exports = {
  registrationLimiter,
  loginLimiterIP,
  loginLimiterEmail,
  otpResendLimiter,
  otpVerifyLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  adminLoginLimiter,
  redisClient
};

// ============================================
// STEP 3: Update auth.js Routes
// ============================================

/*
In backend/routes/auth.js, add the limiters:

const {
  registrationLimiter,
  loginLimiterIP,
  loginLimiterEmail,
  otpResendLimiter,
  otpVerifyLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  adminLoginLimiter
} = require('../middleware/rateLimiter');

// Apply to each route:
router.post('/register', registrationLimiter, async (req, res) => { ... });
router.post('/login', loginLimiterIP, loginLimiterEmail, async (req, res) => { ... });
router.post('/verify-otp', otpVerifyLimiter, async (req, res) => { ... });
router.post('/resend-otp', otpResendLimiter, async (req, res) => { ... });
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => { ... });
router.post('/reset-password', resetPasswordLimiter, async (req, res) => { ... });
router.post('/admin/login', adminLoginLimiter, async (req, res) => { ... });
*/

// ============================================
// STEP 4: Account Lockout Implementation
// ============================================

/*
Add to User model (backend/models/User.js):

{
  failedLoginAttempts: { 
    type: Number, 
    default: 0 
  },
  lockedUntil: { 
    type: Date,
    default: null
  }
}

Add this to login endpoint (before authentication):

// Check if account is locked
if (user.lockedUntil && user.lockedUntil > Date.now()) {
  const remainingTime = Math.ceil((user.lockedUntil - Date.now()) / 1000 / 60);
  return res.status(429).json({
    success: false,
    message: `Account locked. Try again in ${remainingTime} minutes`,
    locked: true,
    lockedUntil: user.lockedUntil
  });
}

// On failed password match:
if (!match) {
  user.failedLoginAttempts += 1;
  
  if (user.failedLoginAttempts >= 5) {
    user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();
    return res.status(429).json({
      success: false,
      message: 'Account locked due to too many failed attempts. Try again in 30 minutes',
      locked: true,
      lockedUntil: user.lockedUntil
    });
  }
  
  await user.save();
  return res.status(401).json({
    success: false,
    message: `Incorrect password (${5 - user.failedLoginAttempts} attempts remaining)`
  });
}

// On successful login:
user.failedLoginAttempts = 0;
user.lockedUntil = null;
await user.save();
*/

// ============================================
// STEP 5: Environment Variables (.env)
// ============================================

/*
Add to backend/.env:

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=redis  # or 'memory' for development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # If required
REDIS_DB=0

# Rate Limit Windows (in milliseconds)
REGISTRATION_WINDOW=900000      # 15 minutes
REGISTRATION_MAX=5
LOGIN_WINDOW=900000             # 15 minutes
LOGIN_MAX=10
FORGOT_PASSWORD_WINDOW=3600000  # 1 hour
FORGOT_PASSWORD_MAX=5
OTP_RESEND_WINDOW=60000         # 1 minute
OTP_RESEND_MAX=3
ACCOUNT_LOCKOUT_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=1800000  # 30 minutes
*/

// ============================================
// STEP 6: Testing Rate Limiters
// ============================================

/*
Test with Postman:

1. Register endpoint:
   - Make 5 successful requests
   - 6th request should be blocked
   - Response: 429 Too Many Requests
   - Header: RateLimit-Limit: 5

2. Login endpoint:
   - Make 5 failed attempts with wrong password
   - Account should be locked for 30 minutes
   - Response: 429 Account Locked
   - Shows: lockedUntil timestamp

3. OTP Resend:
   - Make 3 requests within 1 minute
   - 4th should be blocked
   - Response: 429 Too Many Requests

Inspect Headers:
   - RateLimit-Limit: 5          (Max requests)
   - RateLimit-Remaining: 4      (Requests left)
   - RateLimit-Reset: 1681234567 (Unix timestamp)
*/

// ============================================
// STEP 7: Monitoring & Logging
// ============================================

/*
Add to server.js:

const logger = require('morgan');
app.use(logger('combined'));

Create logs/rate-limit.log to track:
- Too many requests
- Account lockouts
- Suspicious patterns
- Brute force attempts

Recommended: Set up alerts for:
- Multiple failed logins from same IP
- Multiple registrations from same IP
- Rapid OTP verification attempts
*/

// ============================================
// CONFIGURATION SUMMARY
// ============================================

const RATE_LIMIT_CONFIG = {
  registration: {
    window: '15 minutes',
    attempts: 5,
    purpose: 'Prevent registration spam'
  },
  login: {
    window: '15 minutes',
    ipLimit: 10,
    emailLimit: 5,
    purpose: 'Prevent brute force attacks',
    lockout: '30 minutes after 5 failed attempts'
  },
  otpResend: {
    window: '1 minute',
    attempts: 3,
    purpose: 'Prevent OTP enumeration'
  },
  otpVerify: {
    window: '1 minute',
    attempts: 5,
    purpose: 'Prevent OTP brute force'
  },
  forgotPassword: {
    window: '1 hour',
    attempts: 5,
    purpose: 'Prevent password reset spam'
  },
  resetPassword: {
    window: '1 minute',
    attempts: 5,
    purpose: 'Prevent reset abuse'
  },
  adminLogin: {
    window: '15 minutes',
    attempts: 5,
    purpose: 'Stricter for admin security'
  }
};

// ============================================
// DEPLOYMENT NOTES
// ============================================

/*
Production Checklist:

☐ Redis server running and accessible
☐ Redis authentication configured
☐ Rate limits tuned for your traffic
☐ Account lockout notifications enabled
☐ Unlock mechanism implemented (admin or email)
☐ Monitoring and alerting configured
☐ Logs being collected and analyzed
☐ HTTPS enforced for all auth endpoints
☐ CORS properly configured
☐ Database backups scheduled
☐ Email service configured with retry logic
☐ SMTP error handling implemented
☐ Rate limit bypass for trusted IPs (if needed)
☐ Load balancer session affinity for Redis
☐ Rate limiter testing in staging
☐ Rollback plan if issues occur
*/

module.exports = RATE_LIMIT_CONFIG;
