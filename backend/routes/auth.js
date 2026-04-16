const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');

const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });

    if (name.length > 25)
      return res.status(400).json({ success: false, message: 'Name must be 25 characters or less' });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be between 8 and 25 characters long and include one uppercase, one lowercase, one number, and one special character' 
      });
    }

    // Check if user already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const otp = generateOTP();
    const hashed = await bcrypt.hash(password, 10);
    const expires = Date.now() + 10 * 60 * 1000;

    // Save to PendingUser temporarily
    await PendingUser.findOneAndUpdate(
       { email },
       { name, password: hashed, otp, otpExpires: expires },
       { upsert: true, new: true }
    );

    const mailResult = await sendEmail(email, 'Verify Your Email', 'Email Verification', `Your OTP for registration is: <h1 style="color:#1a1a1a; letter-spacing:5px;">${otp}</h1>Valid for 10 minutes.`);

    console.log(`[DEV] OTP for ${email}: ${otp}`);

    res.json({ 
      success: true, 
      message: mailResult?.success ? 'OTP sent to email' : 'Verification required (Check server console)', 
      verifyEmail: true,
      mailSent: mailResult?.success
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Find in Pending storage
    const pending = await PendingUser.findOne({ email, otp, otpExpires: { $gt: Date.now() } });

    if (!pending) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Move to User model (Save only after verification)
    const user = await User.create({
       name: pending.name,
       email: pending.email,
       password: pending.password,
       isVerified: true
    });

    // Clean up pending entry
    await PendingUser.deleteOne({ email });

    const token = generateToken(user);
    res.json({ 
      success: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const pending = await PendingUser.findOne({ email });
    if (!pending) return res.status(404).json({ success: false, message: 'Registration not found' });

    const otp = generateOTP();
    pending.otp = otp;
    pending.otpExpires = Date.now() + 10 * 60 * 1000;
    await pending.save();

    const mailResult = await sendEmail(email, 'Verify Your Email', 'Email Verification', `Your NEW OTP for registration is: <h1 style="color:#1a1a1a; letter-spacing:5px;">${otp}</h1>Valid for 10 minutes.`);

    console.log(`[DEV] New OTP for ${email}: ${otp}`);

    res.json({ 
      success: true, 
      message: mailResult?.success ? 'New OTP sent to email' : 'New OTP generated (Check server console)',
      mailSent: mailResult?.success
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found', accountNotFound: true });
    
    // ============================================
    // SECURITY: Check if account is locked
    // ============================================
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minutes.`,
        locked: true,
        lockedUntil: user.lockedUntil,
        remainingMinutes
      });
    }

    // Reset lock if expired
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ success: false, message: 'Please verify your email first', unverfied: true });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // ============================================
      // SECURITY: Increment failed attempts
      // ============================================
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();
        
        return res.status(429).json({
          success: false,
          message: 'Account locked due to too many failed login attempts. Please try again in 30 minutes.',
          locked: true,
          lockedUntil: user.lockedUntil
        });
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: `Incorrect password (${5 - user.failedLoginAttempts} attempts remaining before account is locked)`,
        attemptsRemaining: 5 - user.failedLoginAttempts
      });
    }
    
    // ============================================
    // SECURITY: Successful login - reset attempts
    // ============================================
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    user.lastLoginIP = clientIP;
    await user.save();
    
    const token = generateToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ id: 'admin', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.json({ success: true, token });
    }
    
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid admin credentials' });
    
    if (!user.isVerified) {
        return res.status(401).json({ success: false, message: 'Please verify your email first' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    
    const token = generateToken(user);
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isVerified: true });
    if (!user) return res.status(404).json({ success: false, message: 'Verified account not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const mailResult = await sendEmail(email, 'Password Reset', 'Reset Your Password', `Your OTP for password reset is: <h1 style="color:#1a1a1a; letter-spacing:5px;">${otp}</h1>Valid for 10 minutes.`);

    console.log(`[DEV] Reset OTP for ${email}: ${otp}`);

    res.json({ 
      success: true, 
      message: mailResult?.success ? 'Reset OTP sent to email' : 'Check console for reset code',
      mailSent: mailResult?.success
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,25}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be between 8 and 25 characters long and include one uppercase, one lowercase, one number, and one special character' 
      });
    }

    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please sign in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
